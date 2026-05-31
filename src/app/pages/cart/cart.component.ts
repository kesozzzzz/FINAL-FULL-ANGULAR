import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../core/models/shop.models';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  protected readonly languageService = inject(LanguageService);
  protected readonly loading = signal(false);
  protected readonly updatingId = signal<string | null>(null);
  protected readonly message = signal('');
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.cartService.loadCart().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set(this.languageService.t('cart.loadError'));
      },
    });
  }

  protected increment(item: CartItem): void {
    this.updateQuantity(item, item.quantity + 1);
  }

  protected decrement(item: CartItem): void {
    this.updateQuantity(item, item.quantity - 1);
  }

  protected remove(item: CartItem): void {
    this.updatingId.set(item.id);
    this.error.set('');
    this.cartService.removeProduct(item.id).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.message.set(this.languageService.t('cart.removed'));
      },
      error: () => {
        this.updatingId.set(null);
        this.error.set(this.languageService.t('cart.removeError'));
      },
    });
  }

  protected clear(): void {
    this.loading.set(true);
    this.cartService.clearCart().subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set(this.languageService.t('cart.cleared'));
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.languageService.t('cart.clearError'));
      },
    });
  }

  protected checkout(): void {
    this.loading.set(true);
    this.cartService.checkout().subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set(this.languageService.t('cart.checkoutDone'));
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.languageService.t('cart.checkoutError'));
      },
    });
  }

  private updateQuantity(item: CartItem, quantity: number): void {
    this.updatingId.set(item.id);
    this.error.set('');
    this.cartService.updateProduct(item.id, quantity).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.message.set(this.languageService.t('cart.quantityUpdated'));
      },
      error: () => {
        this.updatingId.set(null);
        this.error.set(this.languageService.t('cart.quantityError'));
      },
    });
  }
}
