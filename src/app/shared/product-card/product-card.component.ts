import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Product } from '../../core/models/shop.models';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  protected readonly languageService = inject(LanguageService);

  readonly product = input.required<Product>();
  readonly adding = input(false);
  readonly inCart = input(false);
  readonly favorite = input(false);
  readonly favoriting = input(false);
  readonly showDetails = input(true);
  readonly add = output<Product>();
  readonly view = output<Product>();
  readonly favoriteChange = output<Product>();

  protected addClicked(): void {
    this.add.emit(this.product());
  }

  protected viewClicked(): void {
    this.view.emit(this.product());
  }

  protected favoriteClicked(event: MouseEvent): void {
    event.stopPropagation();
    this.favoriteChange.emit(this.product());
  }
}
