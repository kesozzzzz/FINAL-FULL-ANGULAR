import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Gender, SignUpRequest } from '../../../core/models/shop.models';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

interface RegisterForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  age: FormControl<number>;
  email: FormControl<string>;
  password: FormControl<string>;
  address: FormControl<string>;
  phone: FormControl<string>;
  zipcode: FormControl<string>;
  avatar: FormControl<string>;
  gender: FormControl<Gender>;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  protected readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = new FormGroup<RegisterForm>({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(20)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(20)],
    }),
    age: new FormControl(18, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(30)],
    }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('+995', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    zipcode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    avatar: new FormControl('https://i.pravatar.cc/160?img=12', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    gender: new FormControl('OTHER', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: SignUpRequest = {
      ...formValue,
      phone: this.normalizePhone(formValue.phone),
    };
    this.loading.set(true);
    this.error.set('');

    this.authService
      .signUp(payload)
      .pipe(
        switchMap(() =>
          this.authService.requestEmailVerification(payload.email).pipe(catchError(() => of(null))),
        ),
        switchMap(() => this.authService.signIn({ email: payload.email, password: payload.password })),
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigate(['/products']);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(this.authService.getErrorMessage(error));
        },
      });
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    let local = digits.startsWith('995') ? digits.slice(3) : digits;

    if (local.startsWith('0')) {
      local = local.slice(1);
    }

    if (!local.startsWith('5')) {
      local = `5${local}`;
    }

    const nineDigits = local.slice(0, 9).padEnd(9, '0');
    return `+995${nineDigits}`;
  }
}
