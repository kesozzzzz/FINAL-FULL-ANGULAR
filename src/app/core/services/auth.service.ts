import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { AuthResponse, SignInRequest, SignUpRequest, UserProfile } from '../models/shop.models';
import { LanguageService } from './language.service';

const TOKEN_KEY = 'shop:auth-token';
const REFRESH_TOKEN_KEY = 'shop:refresh-token';
const USER_KEY = 'shop:user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenState = signal<string | null>(this.readStorage(TOKEN_KEY));
  private readonly userState = signal<UserProfile | null>(this.readUser());

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  constructor(
    private readonly http: HttpClient,
    private readonly languageService: LanguageService,
  ) {}

  signIn(credentials: SignInRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/sign_in', credentials)
      .pipe(tap((response) => this.setSession(response)));
  }

  signUp(payload: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/sign_up', payload).pipe(
      tap((response) => {
        if (this.extractAccessToken(response)) {
          this.setSession(response);
        }
      }),
    );
  }

  requestEmailVerification(email: string): Observable<unknown> {
    return this.http.post('/auth/verify_email', { email });
  }

  signOut(): Observable<string> {
    return this.http
      .post('/auth/sign_out', {}, { responseType: 'text' })
      .pipe(finalize(() => this.clearSession()));
  }

  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/auth').pipe(tap((user) => this.setUser(user)));
  }

  getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.languageService.t('errors.generic');
    }

    const errorBody = error.error as Record<string, unknown> | string | null;
    if (typeof errorBody === 'string' && errorBody.trim()) {
      return errorBody;
    }

    const bodyRecord =
      errorBody && typeof errorBody === 'object' ? errorBody : ({} as Record<string, unknown>);
    const keys = Array.isArray(bodyRecord['errorKeys']) ? (bodyRecord['errorKeys'] as unknown[]) : [];
    const messages = keys
      .map((key) => (typeof key === 'string' ? this.translateErrorKey(key) : ''))
      .filter(Boolean);

    if (messages.length) {
      return messages.join(' ');
    }

    const message = bodyRecord['message'];
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return error.status
      ? this.languageService.format('errors.failed', { status: error.status })
      : this.languageService.t('errors.wentWrong');
  }

  clearSession(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.removeStorage(TOKEN_KEY);
    this.removeStorage(REFRESH_TOKEN_KEY);
    this.removeStorage(USER_KEY);
  }

  private setSession(response: AuthResponse): void {
    const token = this.extractAccessToken(response);
    const refreshToken = this.extractRefreshToken(response);

    if (token) {
      this.tokenState.set(token);
      this.writeStorage(TOKEN_KEY, token);
    }

    if (refreshToken) {
      this.writeStorage(REFRESH_TOKEN_KEY, refreshToken);
    }

    const tokenUser = token ? this.readUserFromToken(token) : null;

    if (response.user) {
      this.setUser(response.user);
    } else if (tokenUser) {
      this.setUser(tokenUser);
    }
  }

  private setUser(user: UserProfile): void {
    this.userState.set(user);
    this.writeStorage(USER_KEY, JSON.stringify(user));
  }

  private extractAccessToken(response: AuthResponse): string | null {
    return (
      this.readString(response, 'access_token') ??
      this.readString(response, 'accessToken') ??
      this.readString(response, 'token') ??
      this.readNestedString(response, 'tokens', 'accessToken') ??
      this.readNestedString(response, 'tokens', 'access_token')
    );
  }

  private extractRefreshToken(response: AuthResponse): string | null {
    return (
      this.readString(response, 'refresh_token') ??
      this.readString(response, 'refreshToken') ??
      this.readNestedString(response, 'tokens', 'refreshToken') ??
      this.readNestedString(response, 'tokens', 'refresh_token')
    );
  }

  private readString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private readNestedString(source: Record<string, unknown>, parent: string, key: string): string | null {
    const value = source[parent];
    if (!value || typeof value !== 'object') {
      return null;
    }

    return this.readString(value as Record<string, unknown>, key);
  }

  private translateErrorKey(key: string): string {
    const messages: Record<string, string> = {
      'errors.invalid_phone_number': this.languageService.t('errors.invalidPhone'),
      'errors.email_already_exists': this.languageService.t('errors.emailExists'),
      'errors.user_already_exists': this.languageService.t('errors.emailExists'),
      'errors.user_email_not_verified': this.languageService.t('errors.verifyEmail'),
      'errors.invalid_email': this.languageService.t('errors.invalidEmail'),
      'errors.invalid_password': this.languageService.t('errors.invalidPassword'),
    };

    return messages[key] ?? key.replace('errors.', '').replaceAll('_', ' ');
  }

  private readUserFromToken(token: string): UserProfile | null {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
      return JSON.parse(decoded) as UserProfile;
    } catch {
      return null;
    }
  }

  private readUser(): UserProfile | null {
    const saved = this.readStorage(USER_KEY);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as UserProfile;
    } catch {
      return null;
    }
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }
}
