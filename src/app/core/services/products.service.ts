import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import {
  Product,
  ProductCategory,
  ProductPayload,
  ProductQuery,
  ProductsResponse,
  RateProductRequest,
} from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private readonly http: HttpClient) {}

  getProducts(query: ProductQuery): Observable<ProductsResponse> {
    if (query.discountedOnly) {
      return this.getDiscountedProducts(query);
    }

    return this.getProductsPage(query);
  }

  private getProductsPage(query: ProductQuery): Observable<ProductsResponse> {
    const hasSearchFilters = Boolean(
      query.keywords ||
        query.rating ||
        query.priceMin ||
        query.priceMax ||
        query.sortBy ||
        (query.categoryId && query.brand),
    );

    if (hasSearchFilters) {
      return this.searchProducts(query);
    }

    if (query.categoryId) {
      return this.getProductsByCategory(query.categoryId, query.pageIndex, query.pageSize);
    }

    if (query.brand) {
      return this.getProductsByBrand(query.brand, query.pageIndex, query.pageSize);
    }

    return this.getAllProducts(query.pageIndex, query.pageSize);
  }

  private getDiscountedProducts(query: ProductQuery): Observable<ProductsResponse> {
    const sourceQuery: ProductQuery = { ...query, pageIndex: 1, pageSize: 50, discountedOnly: false };

    return this.getProductsPage(sourceQuery).pipe(
      switchMap((firstPage) => {
        const totalPages = Math.max(1, Math.ceil(firstPage.total / firstPage.limit));
        if (totalPages === 1) {
          return of(firstPage.products);
        }

        const requests = Array.from({ length: totalPages - 1 }, (_, index) =>
          this.getProductsPage({ ...sourceQuery, pageIndex: index + 2 }).pipe(
            map((response) => response.products),
          ),
        );

        return forkJoin(requests).pipe(
          map((pages) => [firstPage.products, ...pages].flat()),
        );
      }),
      map((products) => {
        const discounted = products.filter((product) => this.isDiscounted(product));
        const skip = (query.pageIndex - 1) * query.pageSize;

        return {
          total: discounted.length,
          limit: query.pageSize,
          page: query.pageIndex,
          skip,
          products: discounted.slice(skip, skip + query.pageSize),
        };
      }),
    );
  }

  getAllProducts(pageIndex = 1, pageSize = 12): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>('/shop/products/all', {
      params: this.paginationParams(pageIndex, pageSize),
    });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`/shop/products/id/${id}`);
  }

  getProductsByCategory(
    categoryId: string,
    pageIndex = 1,
    pageSize = 12,
  ): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`/shop/products/category/${categoryId}`, {
      params: this.paginationParams(pageIndex, pageSize),
    });
  }

  getProductsByBrand(
    brandName: string,
    pageIndex = 1,
    pageSize = 12,
  ): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`/shop/products/brand/${encodeURIComponent(brandName)}`, {
      params: this.paginationParams(pageIndex, pageSize),
    });
  }

  searchProducts(query: ProductQuery): Observable<ProductsResponse> {
    let params = this.paginationParams(query.pageIndex, query.pageSize);
    params = this.optionalParam(params, 'keywords', query.keywords);
    params = this.optionalParam(params, 'category_id', query.categoryId);
    params = this.optionalParam(params, 'brand', query.brand);
    params = this.optionalParam(params, 'rating', query.rating);
    params = this.optionalParam(params, 'price_min', query.priceMin);
    params = this.optionalParam(params, 'price_max', query.priceMax);
    params = this.optionalParam(params, 'sort_by', query.sortBy);
    params = this.optionalParam(params, 'sort_direction', query.sortDirection);

    return this.http.get<ProductsResponse>('/shop/products/search', { params });
  }

  getCategories(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>('/shop/products/categories');
  }

  getBrands(): Observable<string[]> {
    return this.http.get<string[]>('/shop/products/brands');
  }

  rateProduct(payload: RateProductRequest): Observable<Product> {
    return this.http.post<Product>('/shop/products/rate', payload);
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>('/shop/products', payload);
  }

  updateProduct(id: string, payload: ProductPayload): Observable<Product> {
    return this.http.patch<Product>(`/shop/products/id/${id}`, payload);
  }

  private paginationParams(pageIndex: number, pageSize: number): HttpParams {
    return new HttpParams()
      .set('page_index', String(pageIndex))
      .set('page_size', String(pageSize));
  }

  private optionalParam(
    params: HttpParams,
    key: string,
    value: string | number | undefined,
  ): HttpParams {
    if (value === undefined || value === '') {
      return params;
    }

    return params.set(key, String(value));
  }

  private isDiscounted(product: Product): boolean {
    return (
      product.price.discountPercentage > 0 ||
      product.price.beforeDiscount > product.price.current
    );
  }
}
