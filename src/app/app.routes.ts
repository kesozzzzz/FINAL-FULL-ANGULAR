import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { CartComponent } from './pages/cart/cart.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { ProductsComponent } from './pages/products/products.component';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductsComponent },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: '**', redirectTo: 'products' },
];
