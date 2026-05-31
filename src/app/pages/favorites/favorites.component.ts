import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Product } from '../../core/models/shop.models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { LanguageService } from '../../core/services/language.service';
import { ProductsService } from '../../core/services/products.service';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';

@Component({
  selector: 'app-favorites',
  imports: [ProductCardComponent, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent {
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly languageService = inject(LanguageService);
  protected readonly cartService = inject(CartService);
  private readonly productService = inject(ProductsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly addingProductId = signal<string | null>(null);
  protected readonly favoritingProductId = signal<string | null>(null);
  private requestId = 0;

  constructor() {
    effect(() => {
      const ids = this.favoritesService.ids();
      queueMicrotask(() => untracked(() => this.loadProducts(ids)));
    });
  }

  protected addToCart(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/favorites' } });
      return;
    }

    this.addingProductId.set(product._id);
    this.message.set('');
    this.cartService.addProduct(product, 1).subscribe({
      next: () => {
        this.addingProductId.set(null);
        this.message.set(
          this.cartService.usedLocalFallback()
            ? this.languageService.t('products.addedLocal')
            : this.languageService.t('products.addedToCart'),
        );
      },
      error: (error: unknown) => {
        this.addingProductId.set(null);
        this.error.set(this.authService.getErrorMessage(error));
      },
    });
  }

  protected toggleFavorite(product: Product): void {
    this.favoritingProductId.set(product._id);
    this.message.set('');

    this.favoritesService.toggleProduct(product).subscribe({
      next: (favorite) => {
        this.favoritingProductId.set(null);
        const baseMessage = favorite
          ? this.languageService.t('products.favoriteSaved')
          : this.languageService.t('products.favoriteRemoved');
        this.message.set(
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

  protected goToProducts(): void {
    void this.router.navigate(['/products']);
  }

  private loadProducts(ids: string[]): void {
    const requestId = ++this.requestId;
    this.error.set('');

    if (!ids.length) {
      this.products.set([]);
      this.loading.set(false);
      return;
    }

    const cached = this.favoritesService.products();
    const cachedById = new Map(cached.map((product) => [product._id, product]));

    this.loading.set(true);
    forkJoin(
      ids.map((id) => {
        const cachedProduct = cachedById.get(id);
        return cachedProduct
          ? of(cachedProduct)
          : this.productService.getProductById(id).pipe(catchError(() => of(null)));
      }),
    ).subscribe((products) => {
      if (requestId !== this.requestId) {
        return;
      }

      const loaded = products.filter((product): product is Product => Boolean(product));
      loaded.forEach((product) => this.favoritesService.cacheProduct(product));
      this.products.set(loaded);
      this.loading.set(false);

      if (loaded.length !== ids.length) {
        this.error.set(this.languageService.t('favorites.loadError'));
      }
    });
  }
}
