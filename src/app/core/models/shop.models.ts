export interface ProductPrice {
  current: number;
  currency: string;
  beforeDiscount: number;
  discountPercentage: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  image: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  issueDate: string;
  thumbnail: string;
  stock: number;
  rating: number;
  brand: string;
  warranty: number;
  price: ProductPrice;
  category: ProductCategory;
  images: string[];
}

export interface ProductsResponse {
  total: number;
  limit: number;
  page: number;
  skip: number;
  products: Product[];
}

export type ProductSortBy = 'rating' | 'price' | 'issue_date' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface ProductQuery {
  pageIndex: number;
  pageSize: number;
  keywords?: string;
  categoryId?: string;
  brand?: string;
  rating?: number;
  priceMin?: number;
  priceMax?: number;
  discountedOnly?: boolean;
  sortBy?: ProductSortBy;
  sortDirection?: SortDirection;
}

export interface RateProductRequest {
  productId: string;
  rate: number;
}

export type ProductPayload = Partial<Omit<Product, '_id'>>;

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  address: string;
  phone: string;
  zipcode: string;
  avatar: string;
  gender: Gender;
}

export interface UserProfile {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  role?: string;
  verified?: boolean;
  favoriteProductIds?: string[];
  favorites?: string[];
  wishlist?: string[];
  savedProducts?: string[];
  metadata?: {
    favoriteProductIds?: string[];
    favorites?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: UserProfile;
  [key: string]: unknown;
}

export interface CartItem {
  id: string;
  quantity: number;
  product?: Product;
}

export interface AddToCartRequest {
  id: string;
  quantity: number;
}
