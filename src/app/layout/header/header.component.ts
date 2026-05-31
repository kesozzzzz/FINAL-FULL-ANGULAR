import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly themeService = inject(ThemeService);
  protected readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected toggleLanguage(): void {
    this.languageService.toggle();
  }

  protected signOut(): void {
    this.authService.signOut().subscribe({
      next: () => void this.router.navigate(['/products']),
      error: () => void this.router.navigate(['/products']),
    });
  }
}
