import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
import {
  Product,
  ProductCategory,
  ProductQuery,
  ProductSortBy,
  SortDirection,
} from '../../core/models/shop.models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { LanguageService } from '../../core/services/language.service';
import { ProductsService } from '../../core/services/products.service';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';

interface ProductFiltersForm {
  keywords: FormControl<string>;
  categoryId: FormControl<string>;
  discountedOnly: FormControl<string>;
  brand: FormControl<string>;
  rating: FormControl<string>;
  priceMin: FormControl<string>;
  priceMax: FormControl<string>;
  sortBy: FormControl<string>;
  sortDirection: FormControl<string>;
}

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, DecimalPipe, ProductCardComponent, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  protected readonly productService = inject(ProductsService);
  protected readonly cartService = inject(CartService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly languageService = inject(LanguageService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly brands = signal<string[]>([]);
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly selectedImage = signal('');
  protected readonly expandedImage = signal('');
  protected readonly loading = signal(false);
  protected readonly filtersLoading = signal(false);
  protected readonly error = signal('');
  protected readonly cartMessage = signal('');
  protected readonly favoriteMessage = signal('');
  protected readonly addingProductId = signal<string | null>(null);
  protected readonly favoritingProductId = signal<string | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(12);
  protected readonly total = signal(0);
  private productRequestId = 0;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly visiblePages = computed(() => {
    const current = this.pageIndex();
    const total = this.totalPages();
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });
  protected readonly detailImages = computed(() => {
    const product = this.selectedProduct();
    if (!product) {
      return [];
    }

    const images = [product.thumbnail, ...product.images].filter((image) => image.trim());
    return Array.from(new Set(images));
  });

  protected readonly filterForm = new FormGroup<ProductFiltersForm>({
    keywords: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl('', { nonNullable: true }),
    discountedOnly: new FormControl('', { nonNullable: true }),
    brand: new FormControl('', { nonNullable: true }),
    rating: new FormControl('', { nonNullable: true }),
    priceMin: new FormControl('', { nonNullable: true }),
    priceMax: new FormControl('', { nonNullable: true }),
    sortBy: new FormControl('', { nonNullable: true }),
    sortDirection: new FormControl('asc', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadFilters();
    this.loadProducts();
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => JSON.stringify(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.applyFilters());
  }

  protected applyFilters(): void {
    this.pageIndex.set(1);
    this.loadProducts();
  }

  protected clearFilters(): void {
    this.filterForm.reset(
      {
        keywords: '',
        categoryId: '',
        discountedOnly: '',
        brand: '',
        rating: '',
        priceMin: '',
        priceMax: '',
        sortBy: '',
        sortDirection: 'asc',
      },
      { emitEvent: false },
    );
    this.applyFilters();
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.pageIndex()) {
      return;
    }

    this.pageIndex.set(page);
    this.loadProducts();
  }

  protected changePageSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(pageSize);
    this.pageIndex.set(1);
    this.loadProducts();
  }

  protected openProduct(product: Product): void {
    this.detailLoading.set(true);
    this.selectedProduct.set(product);
    this.selectedImage.set(product.thumbnail);
    this.expandedImage.set('');
    this.favoriteMessage.set('');
    this.productService.getProductById(product._id).subscribe({
      next: (detail) => {
        this.selectedProduct.set(detail);
        this.selectedImage.set(detail.thumbnail || detail.images[0] || '');
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
      },
    });
  }

  protected closeProduct(): void {
    this.selectedProduct.set(null);
    this.selectedImage.set('');
    this.expandedImage.set('');
    this.cartMessage.set('');
    this.favoriteMessage.set('');
  }

  protected addToCart(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/products' } });
      return;
    }

    const user = this.authService.user();
    if (user?.verified === false && user.email) {
      this.authService.requestEmailVerification(user.email).subscribe({ error: () => undefined });
    }

    this.addingProductId.set(product._id);
    this.cartMessage.set('');
    this.cartService.addProduct(product, 1).subscribe({
      next: () => {
        this.addingProductId.set(null);
        this.cartMessage.set(
          this.cartService.usedLocalFallback()
            ? this.languageService.t('products.addedLocal')
            : this.languageService.t('products.addedToCart'),
        );
      },
      error: (error: unknown) => {
        this.addingProductId.set(null);
        this.cartMessage.set(this.authService.getErrorMessage(error));
      },
    });
  }

  protected selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  protected openImage(image: string): void {
    this.expandedImage.set(image);
  }

  protected closeImage(): void {
    this.expandedImage.set('');
  }

  protected toggleFavorite(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/products' } });
      return;
    }

    this.favoritingProductId.set(product._id);
    this.favoriteMessage.set('');
    this.favoritesService.toggleProduct(product).subscribe({
      next: (favorite) => {
        this.favoritingProductId.set(null);
        const baseMessage = favorite
          ? this.languageService.t('products.favoriteSaved')
          : this.languageService.t('products.favoriteRemoved');
        this.favoriteMessage.set(
          this.favoritesService.isLocalOnly()
            ? `${baseMessage} ${this.languageService.t('products.favoriteLocal')}`
            : baseMessage,
        );
      },
      error: () => {
        this.favoritingProductId.set(null);
      },
    });
  }

  private loadFilters(): void {
    this.filtersLoading.set(true);
    forkJoin({
      categories: this.productService.getCategories(),
      brands: this.productService.getBrands(),
    }).subscribe({
      next: ({ categories, brands }) => {
        this.categories.set(categories);
        this.brands.set(brands);
        this.filtersLoading.set(false);
      },
      error: () => {
        this.filtersLoading.set(false);
      },
    });
  }

  private loadProducts(showLoading = true): void {
    const requestId = ++this.productRequestId;
    if (showLoading) {
      this.loading.set(true);
    }
    this.error.set('');

    this.productService.getProducts(this.buildQuery()).subscribe({
      next: (response) => {
        if (requestId !== this.productRequestId) {
          return;
        }

        this.products.set(response.products);
        this.total.set(response.total);
        this.pageIndex.set(response.page);
        this.pageSize.set(response.limit);
        this.loading.set(false);
      },
      error: () => {
        if (requestId !== this.productRequestId) {
          return;
        }

        this.products.set([]);
        this.error.set(this.languageService.t('products.loadError'));
        this.loading.set(false);
      },
    });
  }

  private buildQuery(): ProductQuery {
    const value = this.filterForm.getRawValue();

    return {
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      keywords: this.cleanText(value.keywords),
      categoryId: this.cleanText(value.categoryId),
      discountedOnly: value.discountedOnly === 'discounted',
      brand: this.cleanText(value.brand),
      rating: this.cleanNumber(value.rating),
      priceMin: this.cleanNumber(value.priceMin),
      priceMax: this.cleanNumber(value.priceMax),
      sortBy: this.cleanSort(value.sortBy),
      sortDirection: this.cleanDirection(value.sortDirection),
    };
  }

  private cleanText(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private cleanNumber(value: string): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private cleanSort(value: string): ProductSortBy | undefined {
    return ['rating', 'price', 'issue_date', 'title'].includes(value)
      ? (value as ProductSortBy)
      : undefined;
  }

  private cleanDirection(value: string): SortDirection | undefined {
    return value === 'asc' || value === 'desc' ? value : undefined;
  }
}
