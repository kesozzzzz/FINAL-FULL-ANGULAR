import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AddToCartRequest, CartItem, Product } from '../models/shop.models';

const CART_KEY = 'shop:cart-cache';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<CartItem[]>(this.readLocalCart());
  private readonly localFallbackState = signal(false);

  readonly items = computed(() => this.itemsState());
  readonly usedLocalFallback = computed(() => this.localFallbackState());
  readonly count = computed(() =>
    this.itemsState().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.itemsState().reduce((total, item) => {
      const price = item.product?.price.current ?? 0;
      return total + price * item.quantity;
    }, 0),
  );

  constructor(private readonly http: HttpClient) {}

  loadCart(): Observable<CartItem[]> {
    return this.http.get<unknown>('/shop/cart').pipe(
      map((response) => this.normalizeCart(response)),
      tap((items) => this.setItems(items)),
    );
  }

  addProduct(product: Product, quantity = 1): Observable<CartItem[]> {
    const existing = this.itemsState().find((item) => item.id === product._id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    this.upsertLocal(product, nextQuantity);

    const request: AddToCartRequest = { id: product._id, quantity: nextQuantity };
    const create$ = this.http.post<unknown>('/shop/cart/product', request);
    const update$ = this.http.patch<unknown>('/shop/cart/product', request);
    const action$ = existing
      ? update$.pipe(catchError(() => create$))
      : create$.pipe(catchError(() => update$));

    return action$.pipe(
      tap(() => this.localFallbackState.set(false)),
      catchError(() => {
        this.localFallbackState.set(true);
        return of(null);
      }),
      map((response) => this.applyServerOrLocal(response)),
    );
  }

  updateProduct(productId: string, quantity: number): Observable<CartItem[]> {
    if (quantity <= 0) {
      return this.removeProduct(productId);
    }

    this.itemsState.update((items) =>
      items.map((item) => (item.id === productId ? { ...item, quantity } : item)),
    );
    this.persist();

    const request: AddToCartRequest = { id: productId, quantity };

    return this.http
      .patch<unknown>('/shop/cart/product', request)
      .pipe(catchError(() => this.http.post<unknown>('/shop/cart/product', request)))
      .pipe(
        tap(() => this.localFallbackState.set(false)),
        catchError(() => {
          this.localFallbackState.set(true);
          return of(null);
        }),
        map((response) => this.applyServerOrLocal(response)),
      );
  }

  removeProduct(productId: string): Observable<CartItem[]> {
    this.itemsState.update((items) => items.filter((item) => item.id !== productId));
    this.persist();

    return this.http
      .delete<unknown>('/shop/cart/product', { body: { id: productId } })
      .pipe(map((response) => this.applyServerOrLocal(response)));
  }

  clearCart(): Observable<CartItem[]> {
    this.setItems([]);
    return this.http.delete<unknown>('/shop/cart').pipe(map((response) => this.applyServerOrLocal(response)));
  }

  checkout(): Observable<unknown> {
    return this.http.post<unknown>('/shop/cart/checkout', {}).pipe(tap(() => this.setItems([])));
  }

  isInCart(productId: string): boolean {
    return this.itemsState().some((item) => item.id === productId);
  }

  quantityFor(productId: string): number {
    return this.itemsState().find((item) => item.id === productId)?.quantity ?? 0;
  }

  private applyServerOrLocal(response: unknown): CartItem[] {
    const normalized = this.normalizeCart(response);
    if (normalized.length) {
      this.setItems(normalized);
    } else {
      this.persist();
    }

    return this.itemsState();
  }

  private upsertLocal(product: Product, quantity: number): void {
    this.itemsState.update((items) => {
      const exists = items.some((item) => item.id === product._id);
      if (exists) {
        return items.map((item) =>
          item.id === product._id ? { ...item, product, quantity } : item,
        );
      }

      return [...items, { id: product._id, product, quantity }];
    });
    this.persist();
  }

  private setItems(items: CartItem[]): void {
    this.itemsState.set(items);
    this.persist();
  }

  private normalizeCart(response: unknown): CartItem[] {
    const rawItems = this.extractItems(response);

    return rawItems
      .map((item) => this.normalizeCartItem(item))
      .filter((item): item is CartItem => Boolean(item));
  }

  private extractItems(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const record = response as Record<string, unknown>;
    const candidates = [record['products'], record['items'], record['cart'], record['data']];
    for (const candidate of candidates) {
      const nestedItems = this.extractItems(candidate);
      if (nestedItems.length) {
        return nestedItems;
      }
    }

    return [];
  }

  private normalizeCartItem(value: unknown): CartItem | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const product = this.readProduct(record['product']) ?? this.readProduct(record['productId']);
    const id = this.readId(record, product);
    const local = this.itemsState().find((item) => item.id === id);
    const quantity = this.readNumber(record['quantity']) ?? local?.quantity ?? 1;

    if (!id) {
      return null;
    }

    return {
      id,
      quantity,
      product: product ?? local?.product,
    };
  }

  private readProduct(value: unknown): Product | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    return typeof record['_id'] === 'string' ? (value as Product) : null;
  }

  private readId(record: Record<string, unknown>, product: Product | null): string {
    const directId = record['id'] ?? record['_id'] ?? record['productId'] ?? record['product'];
    if (typeof directId === 'string') {
      return directId;
    }

    return product?._id ?? '';
  }

  private readNumber(value: unknown): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private readLocalCart(): CartItem[] {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(this.itemsState()));
    } catch {
      return;
    }
  }
}
