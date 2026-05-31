import { Injectable, computed, signal } from '@angular/core';

export type LanguageCode = 'en' | 'ka';

const LANGUAGE_KEY = 'shop:language';

const EN_TRANSLATIONS = {
  'header.products': 'Products',
  'header.cart': 'Cart',
  'header.favorites': 'Favorites',
  'header.light': 'Light',
  'header.dark': 'Dark',
  'header.account': 'Account',
  'header.signOut': 'Sign out',
  'header.signIn': 'Sign in',
  'header.createAccount': 'Create account',
  'header.toggleNavigation': 'Toggle navigation',
  'header.switchLanguage': 'ქართული',

  'products.heroEyebrow': 'Online technology shop',
  'products.heroTitle': 'Products that stay searchable, sortable, and cart-ready.',
  'products.heroCopy':
    'Browse live EverREST products with category, brand, price, rating, and sorting filters.',
  'products.statsProducts': 'Products',
  'products.statsCategories': 'Categories',
  'products.statsBrands': 'Brands',
  'products.filters': 'Filters',
  'products.loading': 'Loading',
  'products.search': 'Search',
  'products.searchPlaceholder': 'Laptop, Apple, HP',
  'products.category': 'Category',
  'products.allCategories': 'All categories',
  'products.discount': 'Discount',
  'products.discountAny': 'All products',
  'products.discountedOnly': 'Discounted only',
  'products.brand': 'Brand',
  'products.allBrands': 'All brands',
  'products.minPrice': 'Min price',
  'products.maxPrice': 'Max price',
  'products.minimumRating': 'Minimum rating',
  'products.anyRating': 'Any rating',
  'products.fiveStars': '5 stars',
  'products.fourPlus': '4+ stars',
  'products.threePlus': '3+ stars',
  'products.twoPlus': '2+ stars',
  'products.onePlus': '1+ stars',
  'products.sortBy': 'Sort by',
  'products.default': 'Default',
  'products.price': 'Price',
  'products.rating': 'Rating',
  'products.issueDate': 'Issue date',
  'products.title': 'Title',
  'products.direction': 'Direction',
  'products.asc': 'Asc',
  'products.desc': 'Desc',
  'products.clear': 'Clear',
  'products.products': 'Products',
  'products.page': 'Page',
  'products.of': 'of',
  'products.pageSize': 'Page size',
  'products.noProducts': 'No products found',
  'products.noProductsCopy': 'Try clearing filters or changing the search phrase.',
  'products.prev': 'Prev',
  'products.next': 'Next',
  'products.closeDetails': 'Close product details',
  'products.stock': 'Stock',
  'products.warranty': 'Warranty',
  'products.years': 'years',
  'products.rateProduct': 'Rate product',
  'products.saveRating': 'Save rating',
  'products.savingRating': 'Saving',
  'products.addToCart': 'Add to cart',
  'products.refreshingDetails': 'Refreshing product details...',
  'products.addedToCart': 'Product quantity updated in cart.',
  'products.addedLocal':
    'Added locally. Verify your email to sync cart changes with your account.',
  'products.verifyEmail':
    'Verify your email first. A verification email was requested for your account.',
  'products.loadError': 'Products could not be loaded.',
  'products.ratingSaved': 'Rating saved.',
  'products.ratingError': 'Rating could not be saved.',
  'products.openImage': 'Open product image',
  'products.closeImage': 'Close image',
  'products.favorite': 'Favorite',
  'products.unfavorite': 'Remove favorite',
  'products.favoriteSaved': 'Favorite saved.',
  'products.favoriteRemoved': 'Favorite removed.',
  'products.favoriteLocal':
    'Saved on this device. EverREST did not confirm account sync for favorites.',

  'productCard.details': 'Details',
  'productCard.adding': 'Adding',
  'productCard.addOneMore': 'Add one more',
  'productCard.addToCart': 'Add to cart',
  'productCard.view': 'View',

  'cart.eyebrow': 'Shopping cart',
  'cart.title': 'Your selected products',
  'cart.continue': 'Continue shopping',
  'cart.loading': 'Loading cart...',
  'cart.productImage': 'Product image',
  'cart.product': 'Product',
  'cart.remove': 'Remove',
  'cart.summary': 'Summary',
  'cart.items': 'Items',
  'cart.subtotal': 'Subtotal',
  'cart.checkoutCopy': 'Shipping and final payment are handled by the checkout endpoint.',
  'cart.checkout': 'Checkout',
  'cart.clear': 'Clear cart',
  'cart.emptyTitle': 'Your cart is empty',
  'cart.emptyCopy': 'Add products after signing in and they will appear here.',
  'cart.browse': 'Browse products',
  'cart.loadError': 'Server cart could not be loaded. Showing saved cart items.',
  'cart.removed': 'Item removed from cart.',
  'cart.removeError': 'Could not remove item.',
  'cart.cleared': 'Cart cleared.',
  'cart.clearError': 'Could not clear cart.',
  'cart.checkoutDone': 'Checkout completed successfully.',
  'cart.checkoutError': 'Checkout failed. Please try again.',
  'cart.quantityUpdated': 'Quantity updated.',
  'cart.quantityError': 'Could not update quantity.',

  'favorites.eyebrow': 'Favorites',
  'favorites.title': 'Products you saved',
  'favorites.copy': 'Favorite products stay collected here while you shop.',
  'favorites.emptyTitle': 'No favorites yet',
  'favorites.emptyCopy': 'Use the heart button on products to save them here.',
  'favorites.loading': 'Loading favorites...',
  'favorites.loadError': 'Some favorite products could not be loaded.',
  'favorites.remove': 'Remove',
  'favorites.localOnly':
    'Favorites are saved on this device only because the API did not confirm account sync.',

  'login.eyebrow': 'Welcome back',
  'login.title': 'Sign in before adding products to cart.',
  'login.copy':
    'Cart actions are connected to the authenticated EverREST cart, so quantities stay attached to your account.',
  'login.heading': 'Sign in',
  'login.email': 'Email',
  'login.emailError': 'Enter a valid email.',
  'login.password': 'Password',
  'login.passwordError': 'Password must be at least 8 characters.',
  'login.signingIn': 'Signing in',
  'login.newCustomer': 'New customer?',

  'register.eyebrow': 'Create account',
  'register.title': 'Register once, then use the live shop cart.',
  'register.copy':
    'EverREST requires profile details during sign up. After registration the app signs you in automatically.',
  'register.heading': 'Registration',
  'register.firstName': 'First name',
  'register.lastName': 'Last name',
  'register.age': 'Age',
  'register.gender': 'Gender',
  'register.other': 'Other',
  'register.female': 'Female',
  'register.male': 'Male',
  'register.email': 'Email',
  'register.password': 'Password',
  'register.passwordError': 'Password must be 8-30 characters.',
  'register.address': 'Address',
  'register.phone': 'Phone',
  'register.phoneHelp': 'Type any number. It will be sent to EverREST as +995 format.',
  'register.zipcode': 'Zip code',
  'register.avatar': 'Avatar URL',
  'register.creating': 'Creating account',
  'register.alreadyRegistered': 'Already registered?',

  'errors.generic': 'Something went wrong. Please try again.',
  'errors.failed': 'Request failed with status {status}.',
  'errors.wentWrong': 'Something went wrong.',
  'errors.invalidPhone': 'Phone must be in Georgian format, for example +995555123456.',
  'errors.emailExists': 'This email is already registered.',
  'errors.verifyEmail': 'Please verify your email before using account-only actions like cart.',
  'errors.invalidEmail': 'Enter a valid email address.',
  'errors.invalidPassword': 'Password must be 8-30 characters.',
} as const;

export type TranslationKey = keyof typeof EN_TRANSLATIONS;

const KA_TRANSLATIONS: Record<TranslationKey, string> = {
  'header.products': 'პროდუქტები',
  'header.cart': 'კალათა',
  'header.favorites': 'რჩეულები',
  'header.light': 'ღია',
  'header.dark': 'მუქი',
  'header.account': 'ანგარიში',
  'header.signOut': 'გასვლა',
  'header.signIn': 'შესვლა',
  'header.createAccount': 'რეგისტრაცია',
  'header.toggleNavigation': 'ნავიგაციის გახსნა',
  'header.switchLanguage': 'English',

  'products.heroEyebrow': 'ონლაინ ტექნიკის მაღაზია',
  'products.heroTitle': 'პროდუქტები სწრაფი ძებნით, სორტირებით და კალათით.',
  'products.heroCopy':
    'დაათვალიერე EverREST-ის პროდუქტები კატეგორიის, ბრენდის, ფასის, შეფასებისა და სორტირების ფილტრებით.',
  'products.statsProducts': 'პროდუქტი',
  'products.statsCategories': 'კატეგორია',
  'products.statsBrands': 'ბრენდი',
  'products.filters': 'ფილტრები',
  'products.loading': 'იტვირთება',
  'products.search': 'ძებნა',
  'products.searchPlaceholder': 'Laptop, Apple, HP',
  'products.category': 'კატეგორია',
  'products.allCategories': 'ყველა კატეგორია',
  'products.discount': 'ფასდაკლება',
  'products.discountAny': 'ყველა პროდუქტი',
  'products.discountedOnly': 'მხოლოდ ფასდაკლებული',
  'products.brand': 'ბრენდი',
  'products.allBrands': 'ყველა ბრენდი',
  'products.minPrice': 'მინ. ფასი',
  'products.maxPrice': 'მაქს. ფასი',
  'products.minimumRating': 'მინ. შეფასება',
  'products.anyRating': 'ნებისმიერი შეფასება',
  'products.fiveStars': '5 ვარსკვლავი',
  'products.fourPlus': '4+ ვარსკვლავი',
  'products.threePlus': '3+ ვარსკვლავი',
  'products.twoPlus': '2+ ვარსკვლავი',
  'products.onePlus': '1+ ვარსკვლავი',
  'products.sortBy': 'სორტირება',
  'products.default': 'ნაგულისხმევი',
  'products.price': 'ფასი',
  'products.rating': 'შეფასება',
  'products.issueDate': 'გამოშვების თარიღი',
  'products.title': 'სათაური',
  'products.direction': 'მიმართულება',
  'products.asc': 'ზრდადობით',
  'products.desc': 'კლებადობით',
  'products.clear': 'გასუფთავება',
  'products.products': 'პროდუქტები',
  'products.page': 'გვერდი',
  'products.of': '/',
  'products.pageSize': 'რაოდენობა',
  'products.noProducts': 'პროდუქტი ვერ მოიძებნა',
  'products.noProductsCopy': 'სცადე ფილტრების გასუფთავება ან სხვა საძიებო ტექსტი.',
  'products.prev': 'წინა',
  'products.next': 'შემდეგი',
  'products.closeDetails': 'პროდუქტის დეტალების დახურვა',
  'products.stock': 'მარაგი',
  'products.warranty': 'გარანტია',
  'products.years': 'წელი',
  'products.rateProduct': 'პროდუქტის შეფასება',
  'products.saveRating': 'შეფასების შენახვა',
  'products.savingRating': 'ინახება',
  'products.addToCart': 'კალათაში დამატება',
  'products.refreshingDetails': 'პროდუქტის დეტალები ახლდება...',
  'products.addedToCart': 'პროდუქტის რაოდენობა კალათაში განახლდა.',
  'products.addedLocal':
    'პროდუქტი ლოკალურად დაემატა. კალათის ანგარიშზე სინქისთვის დაადასტურე ელფოსტა.',
  'products.verifyEmail':
    'ჯერ დაადასტურე ელფოსტა. ანგარიშზე ვერიფიკაციის წერილი გამოიგზავნა.',
  'products.loadError': 'პროდუქტების ჩატვირთვა ვერ მოხერხდა.',
  'products.ratingSaved': 'შეფასება შენახულია.',
  'products.ratingError': 'შეფასების შენახვა ვერ მოხერხდა.',
  'products.openImage': 'პროდუქტის ფოტოს გახსნა',
  'products.closeImage': 'ფოტოს დახურვა',
  'products.favorite': 'დაგულება',
  'products.unfavorite': 'რჩეულებიდან ამოღება',
  'products.favoriteSaved': 'პროდუქტი რჩეულებში დაემატა.',
  'products.favoriteRemoved': 'პროდუქტი რჩეულებიდან ამოიშალა.',
  'products.favoriteLocal':
    'შენახულია ამ მოწყობილობაზე. EverREST-მა რჩეულების ანგარიშზე სინქი არ დაადასტურა.',

  'productCard.details': 'დეტალები',
  'productCard.adding': 'ემატება',
  'productCard.addOneMore': 'კიდევ ერთის დამატება',
  'productCard.addToCart': 'კალათაში დამატება',
  'productCard.view': 'ნახვა',

  'cart.eyebrow': 'საყიდლების კალათა',
  'cart.title': 'შერჩეული პროდუქტები',
  'cart.continue': 'შოპინგის გაგრძელება',
  'cart.loading': 'კალათა იტვირთება...',
  'cart.productImage': 'პროდუქტის ფოტო',
  'cart.product': 'პროდუქტი',
  'cart.remove': 'წაშლა',
  'cart.summary': 'შეჯამება',
  'cart.items': 'ნივთები',
  'cart.subtotal': 'ჯამი',
  'cart.checkoutCopy': 'მიტანა და საბოლოო გადახდა checkout endpoint-ით მუშავდება.',
  'cart.checkout': 'გადახდა',
  'cart.clear': 'კალათის გასუფთავება',
  'cart.emptyTitle': 'კალათა ცარიელია',
  'cart.emptyCopy': 'შესვლის შემდეგ დაამატე პროდუქტები და აქ გამოჩნდება.',
  'cart.browse': 'პროდუქტების ნახვა',
  'cart.loadError': 'სერვერის კალათა ვერ ჩაიტვირთა. ნაჩვენებია შენახული ნივთები.',
  'cart.removed': 'ნივთი კალათიდან წაიშალა.',
  'cart.removeError': 'ნივთის წაშლა ვერ მოხერხდა.',
  'cart.cleared': 'კალათა გასუფთავდა.',
  'cart.clearError': 'კალათის გასუფთავება ვერ მოხერხდა.',
  'cart.checkoutDone': 'Checkout წარმატებით დასრულდა.',
  'cart.checkoutError': 'Checkout ვერ შესრულდა. სცადე თავიდან.',
  'cart.quantityUpdated': 'რაოდენობა განახლდა.',
  'cart.quantityError': 'რაოდენობის განახლება ვერ მოხერხდა.',

  'favorites.eyebrow': 'რჩეულები',
  'favorites.title': 'შენ მიერ დაგულებული პროდუქტები',
  'favorites.copy': 'დაგულებული პროდუქტები აქ გროვდება, სანამ არჩევ.',
  'favorites.emptyTitle': 'რჩეულები ჯერ ცარიელია',
  'favorites.emptyCopy': 'პროდუქტზე გულის ღილაკით შეინახე ნივთები აქ.',
  'favorites.loading': 'რჩეულები იტვირთება...',
  'favorites.loadError': 'ზოგი რჩეული პროდუქტის ჩატვირთვა ვერ მოხერხდა.',
  'favorites.remove': 'ამოღება',
  'favorites.localOnly':
    'რჩეულები მხოლოდ ამ მოწყობილობაზეა შენახული, რადგან API-მ ანგარიშზე სინქი არ დაადასტურა.',

  'login.eyebrow': 'კეთილი დაბრუნება',
  'login.title': 'კალათაში დამატებამდე გაიარე ავტორიზაცია.',
  'login.copy':
    'კალათის მოქმედებები EverREST-ის ავტორიზებულ კალათასთან არის დაკავშირებული, ამიტომ რაოდენობები შენს ანგარიშზე ინახება.',
  'login.heading': 'შესვლა',
  'login.email': 'ელფოსტა',
  'login.emailError': 'შეიყვანე სწორი ელფოსტა.',
  'login.password': 'პაროლი',
  'login.passwordError': 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.',
  'login.signingIn': 'შესვლა მიმდინარეობს',
  'login.newCustomer': 'ახალი მომხმარებელი ხარ?',

  'register.eyebrow': 'ანგარიშის შექმნა',
  'register.title': 'ერთხელ დარეგისტრირდი და გამოიყენე ცოცხალი კალათა.',
  'register.copy':
    'EverREST რეგისტრაციისას პროფილის დეტალებს ითხოვს. რეგისტრაციის შემდეგ აპი ავტომატურად შეგიყვანს.',
  'register.heading': 'რეგისტრაცია',
  'register.firstName': 'სახელი',
  'register.lastName': 'გვარი',
  'register.age': 'ასაკი',
  'register.gender': 'სქესი',
  'register.other': 'სხვა',
  'register.female': 'ქალი',
  'register.male': 'კაცი',
  'register.email': 'ელფოსტა',
  'register.password': 'პაროლი',
  'register.passwordError': 'პაროლი 8-30 სიმბოლო უნდა იყოს.',
  'register.address': 'მისამართი',
  'register.phone': 'ტელეფონი',
  'register.phoneHelp': 'ჩაწერე ნებისმიერი ნომერი. EverREST-ში +995 ფორმატით გაიგზავნება.',
  'register.zipcode': 'საფოსტო კოდი',
  'register.avatar': 'ავატარის URL',
  'register.creating': 'იქმნება ანგარიში',
  'register.alreadyRegistered': 'უკვე დარეგისტრირებული ხარ?',

  'errors.generic': 'რაღაც შეცდომა მოხდა. სცადე თავიდან.',
  'errors.failed': 'მოთხოვნა დასრულდა სტატუსით {status}.',
  'errors.wentWrong': 'რაღაც შეცდომა მოხდა.',
  'errors.invalidPhone': 'ტელეფონი ქართული ფორმატით უნდა იყოს, მაგალითად +995555123456.',
  'errors.emailExists': 'ეს ელფოსტა უკვე რეგისტრირებულია.',
  'errors.verifyEmail': 'კალათის მსგავსი ანგარიშზე მიბმული მოქმედებებისთვის ჯერ დაადასტურე ელფოსტა.',
  'errors.invalidEmail': 'შეიყვანე სწორი ელფოსტა.',
  'errors.invalidPassword': 'პაროლი 8-30 სიმბოლო უნდა იყოს.',
};

const TRANSLATIONS: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: EN_TRANSLATIONS,
  ka: KA_TRANSLATIONS,
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageState = signal<LanguageCode>(this.readInitialLanguage());

  readonly language = computed(() => this.languageState());
  readonly isGeorgian = computed(() => this.languageState() === 'ka');

  constructor() {
    this.applyLanguage(this.languageState());
  }

  t(key: TranslationKey): string {
    return TRANSLATIONS[this.languageState()][key];
  }

  format(key: TranslationKey, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      this.t(key),
    );
  }

  toggle(): void {
    this.setLanguage(this.isGeorgian() ? 'en' : 'ka');
  }

  setLanguage(language: LanguageCode): void {
    this.languageState.set(language);
    this.applyLanguage(language);
    this.writeStorage(language);
  }

  private readInitialLanguage(): LanguageCode {
    const saved = this.readStorage();
    return saved === 'ka' || saved === 'en' ? saved : 'en';
  }

  private applyLanguage(language: LanguageCode): void {
    try {
      document.documentElement.lang = language;
      document.documentElement.dataset['language'] = language;
    } catch {
      return;
    }
  }

  private readStorage(): string | null {
    try {
      return localStorage.getItem(LANGUAGE_KEY);
    } catch {
      return null;
    }
  }

  private writeStorage(language: LanguageCode): void {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      return;
    }
  }
}
