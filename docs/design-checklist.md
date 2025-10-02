
## Pre-Implementation Design Checklist

### 1. **State Management Strategy**
- **Decision:** Global state solution (NgRx, Akita, services + BehaviorSubjects)
- **Scope:** What goes in state vs. local component state?
- **Persistence:** What persists across refreshes? Where (localStorage, sessionStorage, server)?
- **State sync:** Single source of truth pattern
- **State hydration:** Order of operations on app init

### 2. **Routing Architecture**
- **URL as state:** All application state reflected in URL when possible
- **Route guards:** Authentication, authorization, data pre-loading
- **Lazy loading:** Module boundaries and load strategy
- **Route params vs query params:** When to use each
- **Deep linking:** Every state should be bookmarkable/shareable
- **Browser navigation:** Back/forward must work correctly
- **Route state:** Passing data between routes without URL pollution

### 3. **Data Flow & Persistence Layers**
- **Priority hierarchy:** URL → Session → Local → API → Defaults
- **Hydration strategy:** When and how to restore state
- **Cache strategy:** What to cache, where, for how long
- **Sync strategy:** How to handle stale data
- **Conflict resolution:** What happens when URL and localStorage disagree?

### 4. **Authentication & Authorization**
- **Token storage:** Where (memory, sessionStorage, httpOnly cookies)
- **Token refresh:** Automatic or manual, before or after expiration
- **Auth state:** How it propagates through the app
- **Protected routes:** Guard implementation
- **Auth persistence:** Stay logged in across tabs/refreshes
- **Logout:** Complete cleanup strategy

### 5. **Session Management**
- **Session scope:** Tab vs browser vs device
- **Session timeout:** Activity-based or absolute
- **Multi-tab behavior:** Share session or independent?
- **Session recovery:** What happens after timeout
- **Cross-tab communication:** BroadcastChannel, localStorage events

### 6. **Browser Storage Strategy**
```typescript
// DEFINE THIS UPFRONT:
interface StoragePolicy {
  localStorage: {
    // Survives: Browser close, tab close, refresh
    contains: ['userPreferences', 'theme', 'recentSearches']
    maxAge: '30 days'
    namespace: 'app:local:'
  }
  
  sessionStorage: {
    // Survives: Refresh (same tab only)
    contains: ['draftForms', 'scrollPosition', 'tempFilters']
    maxAge: 'session'
    namespace: 'app:session:'
  }
  
  memory: {
    // Survives: Nothing (lost on refresh)
    contains: ['currentUser', 'authToken', 'runtimeCache']
  }
  
  server: {
    // Survives: Everything
    contains: ['userAccount', 'savedSearches', 'settings']
  }
}
```

### 7. **Navigation Lifecycle Hooks**
- **APP_INITIALIZER:** Pre-bootstrap setup (config, auth check)
- **Route resolvers:** Pre-load data before component init
- **Route guards:** Can activate/deactivate/leave
- **Component lifecycle:** OnInit, OnDestroy, route param subscriptions
- **Navigation events:** Start, end, error handling

### 8. **Error Handling & Recovery**
- **Network errors:** Retry strategy, offline mode
- **Auth errors:** Token refresh, re-login
- **Navigation errors:** 404, 403, redirect strategy
- **State corruption:** Detection and recovery
- **Storage quota:** Handling full storage

### 9. **Performance Considerations**
- **Initial load:** What loads immediately vs lazily
- **Route preloading:** Strategy for prefetching modules
- **State rehydration:** Async vs sync, blocking vs non-blocking
- **Storage access:** Sync vs async reads
- **Memory leaks:** Subscription management pattern

### 10. **Developer Experience (DX)**
- **Debugging:** State inspector, time-travel debugging
- **Logging:** What gets logged, where, when
- **Dev tools:** State visualization
- **Hot reload:** What survives, what doesn't
- **Testing:** Mocking storage, routing, state

---

## The "Skeleton Code" Required Before Building Features

### Core Architecture Files (Create First):

```
src/app/
├── core/
│   ├── core.module.ts                    # Singleton services
│   ├── guards/
│   │   ├── auth.guard.ts                 # Route protection
│   │   └── unsaved-changes.guard.ts      # Prevent data loss
│   ├── interceptors/
│   │   ├── auth.interceptor.ts           # Add tokens to requests
│   │   ├── error.interceptor.ts          # Global error handling
│   │   └── cache.interceptor.ts          # HTTP caching
│   ├── services/
│   │   ├── auth.service.ts               # Authentication logic
│   │   ├── storage.service.ts            # Storage abstraction
│   │   ├── state-management.service.ts   # Global state
│   │   └── navigation.service.ts         # Navigation helpers
│   └── models/
│       ├── app-state.model.ts            # Global state interface
│       └── storage-key.enum.ts           # Storage key constants
│
├── shared/
│   ├── shared.module.ts
│   └── services/
│       └── route-state.service.ts        # Route state management
│
└── app-routing.module.ts                 # Route configuration
```

---

## Critical Patterns to Implement First

### Pattern 1: **Storage Service (Abstraction Layer)**

```typescript
// services/storage.service.ts
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly namespace = 'transport:';
  
  // Type-safe storage access
  setLocal<T>(key: string, value: T): void {
    localStorage.setItem(
      `${this.namespace}local:${key}`,
      JSON.stringify(value)
    );
  }
  
  getLocal<T>(key: string): T | null {
    const item = localStorage.getItem(`${this.namespace}local:${key}`);
    return item ? JSON.parse(item) : null;
  }
  
  setSession<T>(key: string, value: T): void { /* similar */ }
  getSession<T>(key: string): T | null { /* similar */ }
  
  clear(): void {
    // Clear only app-namespaced items
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.namespace))
      .forEach(key => localStorage.removeItem(key));
  }
}
```

### Pattern 2: **State Management Service**

```typescript
// services/state-management.service.ts
@Injectable({ providedIn: 'root' })
export class StateManagementService {
  private stateSubject = new BehaviorSubject<AppState>(initialState);
  public state$ = this.stateSubject.asObservable();
  
  constructor(
    private storage: StorageService,
    private route: ActivatedRoute
  ) {
    this.initializeState();
  }
  
  private initializeState(): void {
    // Priority: URL > Session > Local > Defaults
    const urlState = this.getStateFromUrl();
    const sessionState = this.storage.getSession('appState');
    const localState = this.storage.getLocal('preferences');
    
    const mergedState = {
      ...defaultState,
      ...localState,
      ...sessionState,
      ...urlState  // URL wins
    };
    
    this.stateSubject.next(mergedState);
  }
  
  setState(updates: Partial<AppState>): void {
    const current = this.stateSubject.value;
    const newState = { ...current, ...updates };
    
    this.stateSubject.next(newState);
    this.persistState(newState);
    this.syncToUrl(newState);
  }
}
```

### Pattern 3: **Route State Service**

```typescript
// services/route-state.service.ts
@Injectable({ providedIn: 'root' })
export class RouteStateService {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  // Update URL without navigation
  updateQueryParams(params: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: false  // Add to history
    });
  }
  
  // Read state from URL
  getQueryParam(key: string): string | null {
    return this.route.snapshot.queryParamMap.get(key);
  }
  
  // Observable for query param changes
  watchQueryParam(key: string): Observable<string | null> {
    return this.route.queryParamMap.pipe(
      map(params => params.get(key)),
      distinctUntilChanged()
    );
  }
}
```

### Pattern 4: **App Initializer (Bootstrap Logic)**

```typescript
// app.module.ts
export function initializeApp(
  authService: AuthService,
  stateService: StateManagementService
): () => Promise<void> {
  return () => {
    return new Promise((resolve) => {
      // 1. Check authentication
      authService.checkAuth().pipe(
        // 2. Restore state
        switchMap(() => stateService.restoreState()),
        // 3. Load config
        switchMap(() => configService.loadConfig())
      ).subscribe({
        next: () => resolve(),
        error: () => resolve()  // Don't block app on errors
      });
    });
  };
}

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, StateManagementService],
      multi: true
    }
  ]
})
export class AppModule {}
```

### Pattern 5: **Route Guards**

```typescript
// guards/auth.guard.ts
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private storage: StorageService
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.auth.isAuthenticated$.pipe(
      map(isAuth => {
        if (!isAuth) {
          // Save intended destination
          this.storage.setSession('returnUrl', route.url.toString());
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
  }
}
```

---

## The Big Picture: Data Flow on App Start

```
1. Browser loads app
   ↓
2. APP_INITIALIZER runs
   ├─ Check localStorage for auth token
   ├─ Validate token with server
   └─ Restore user preferences
   ↓
3. Angular bootstrap completes
   ↓
4. Router activates initial route
   ├─ Route guards check auth
   ├─ Route resolver pre-loads data
   └─ Query params read from URL
   ↓
5. Component initializes
   ├─ Subscribe to state services
   ├─ Read URL params (highest priority)
   ├─ Read sessionStorage (draft data)
   ├─ Read localStorage (preferences)
   └─ Apply defaults for missing values
   ↓
6. Component renders with complete state
```

---

## Professional Checklist Summary

Before writing feature code, you should have:

✅ **Storage abstraction layer** with namespacing  
✅ **State management service** with clear persistence rules  
✅ **Route state service** for URL synchronization  
✅ **App initializer** for bootstrap sequence  
✅ **Auth service** with token management  
✅ **Route guards** for navigation control  
✅ **HTTP interceptors** for auth/errors  
✅ **Clear state priority hierarchy documented**  
✅ **Storage policy defined** (what goes where)  
✅ **Navigation lifecycle mapped out**  

Once these are in place, every feature you build will "just work" with:
- Browser back/forward buttons ✅
- Page refreshes ✅
- Deep linking ✅
- Multi-tab scenarios ✅
- Authentication flows ✅

**This is the professional foundation that prevents the brownfield nightmare you described.**

Would you like me to generate complete, production-ready implementations of any of these patterns for your Transportation portal?
