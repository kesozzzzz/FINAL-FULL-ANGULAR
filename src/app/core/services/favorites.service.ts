import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Product, UserProfile } from '../models/shop.models';
import { AuthService } from './auth.service';

type FavoriteSyncState = 'idle' | 'synced' | 'localOnly' | 'syncing';

interface FavoriteStore {
  ids: string[];
  products: Record<string, Product>;
}

const FAVORITES_KEY = 'shop:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly idsState = signal<string[]>([]);
  private readonly productCacheState = signal<Record<string, Product>>({});
  private readonly syncStateState = signal<FavoriteSyncState>('idle');
  private activeStorageKey = this.storageKey();
  private loadedAccountKey: string | null = null;

  readonly ids = computed(() => this.idsState());
  readonly count = computed(() => this.idsState().length);
  readonly products = computed(() =>
    this.idsState()
      .map((id) => this.productCacheState()[id])
      .filter((product): product is Product => Boolean(product)),
  );
  readonly syncState = computed(() => this.syncStateState());
  readonly isLocalOnly = computed(() => this.syncStateState() === 'localOnly');

  constructor() {
    this.loadLocal(this.activeStorageKey);

    effect(() => {
      const user = this.authService.user();
      const authenticated = this.authService.isAuthenticated();

      queueMicrotask(() => untracked(() => {
        const nextKey = this.storageKeyForUser(user);
        if (nextKey !== this.activeStorageKey) {
          this.activeStorageKey = nextKey;
          this.loadedAccountKey = null;
          this.loadLocal(nextKey);
        }

        if (!authenticated || user?.verified === false) {
          this.syncStateState.set(this.idsState().length ? 'localOnly' : 'idle');
          return;
        }

        if (this.loadedAccountKey !== nextKey) {
          this.loadedAccountKey = nextKey;
          this.loadAccountFavorites();
        }
      }));
    });
  }

  isFavorite(productId: string): boolean {
    return this.idsState().includes(productId);
  }

  toggleProduct(product: Product): Observable<boolean> {
    const wasFavorite = this.isFavorite(product._id);
    const nextIds = wasFavorite
      ? this.idsState().filter((id) => id !== product._id)
      : [product._id, ...this.idsState()];

    this.productCacheState.update((cache) => ({ ...cache, [product._id]: product }));
    this.setIds(nextIds);

    return this.persistAccount(nextIds).pipe(map(() => !wasFavorite));
  }

  removeProduct(productId: string): Observable<boolean> {
    const nextIds = this.idsState().filter((id) => id !== productId);
    this.setIds(nextIds);

    return this.persistAccount(nextIds).pipe(map(() => false));
  }

  cacheProduct(product: Product): void {
    this.productCacheState.update((cache) => ({ ...cache, [product._id]: product }));
    this.persistLocal();
  }

  private setIds(ids: string[]): void {
    this.idsState.set(Array.from(new Set(ids)));
    this.persistLocal();
  }

  private persistAccount(ids: string[]): Observable<boolean> {
    const user = this.authService.user();
    if (!this.authService.isAuthenticated() || user?.verified === false) {
      this.syncStateState.set('localOnly');
      return of(false);
    }

    this.syncStateState.set('syncing');

    return this.http.patch<unknown>('/auth/update', { favoriteProductIds: ids }).pipe(
      map((response) => this.hasServerFavorites(response, ids)),
      tap((synced) => this.syncStateState.set(synced ? 'synced' : 'localOnly')),
      catchError(() => {
        this.syncStateState.set('localOnly');
        return of(false);
      }),
    );
  }

  private loadAccountFavorites(): void {
    if (!this.authService.isAuthenticated()) {
      this.syncStateState.set(this.idsState().length ? 'localOnly' : 'idle');
      return;
    }

    this.http.get<UserProfile>('/auth').subscribe({
      next: (profile) => {
        const serverIds = this.readFavoriteIds(profile);
        if (!serverIds.length) {
          this.syncStateState.set(this.idsState().length ? 'localOnly' : 'idle');
          return;
        }

        this.setIds([...serverIds, ...this.idsState()]);
        this.syncStateState.set('synced');
      },
      error: () => {
        this.syncStateState.set(this.idsState().length ? 'localOnly' : 'idle');
      },
    });
  }

  private hasServerFavorites(response: unknown, ids: string[]): boolean {
    const serverIds = this.readFavoriteIds(response);
    return ids.every((id) => serverIds.includes(id));
  }

  private readFavoriteIds(source: unknown): string[] {
    if (!source || typeof source !== 'object') {
      return [];
    }

    const record = source as UserProfile;
    const candidates = [
      record.favoriteProductIds,
      record.favorites,
      record.wishlist,
      record.savedProducts,
      record.metadata?.favoriteProductIds,
      record.metadata?.favorites,
    ];

    const ids = candidates
      .flatMap((candidate) => (Array.isArray(candidate) ? candidate : []))
      .filter((id): id is string => typeof id === 'string' && Boolean(id.trim()));

    return Array.from(new Set(ids));
  }

  private loadLocal(key: string): void {
    try {
      const saved = localStorage.getItem(key);
      const parsed = saved ? (JSON.parse(saved) as Partial<FavoriteStore>) : {};
      this.idsState.set(Array.isArray(parsed.ids) ? parsed.ids.filter(Boolean) : []);
      this.productCacheState.set(parsed.products ?? {});
    } catch {
      this.idsState.set([]);
      this.productCacheState.set({});
    }
  }

  private persistLocal(): void {
    try {
      const store: FavoriteStore = {
        ids: this.idsState(),
        products: this.productCacheState(),
      };
      localStorage.setItem(this.activeStorageKey, JSON.stringify(store));
    } catch {
      return;
    }
  }

  private storageKey(): string {
    return this.storageKeyForUser(this.authService.user());
  }

  private storageKeyForUser(user: UserProfile | null): string {
    const accountId = user?._id ?? user?.id ?? user?.email ?? 'guest';
    return `${FAVORITES_KEY}:${accountId}`;
  }
}
