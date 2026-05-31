import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const API_BASE_URL = 'https://api.everrest.educata.dev';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

  const apiRequest = request.clone({
    url: normalizeUrl(request.url),
    setHeaders: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(apiRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession();
        void router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    }),
  );
};

function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
}
