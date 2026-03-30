# Integrating @halolabs/ngx-popout into a Brownfield Angular Application

**Application**: Transportation Portal (FAA Aircraft Registry Explorer)
**Angular Version**: 14.3
**UI Framework**: ng-zorro-antd
**Before**: No popout capability — all components render inline
**After**: Results table and statistics histograms can be popped out into separate windows

---

## Prerequisites

- Angular 14+ application with `@angular/cdk` already installed
- `@halolabs/ngx-popout@2.0.0` available via npm registry or tarball

---

## Step 1: Install the Library

The library is published to a private GitLab npm registry. Create `.npmrc` in your project root:

```ini
@halolabs:registry=http://gitlab.minilab/api/v4/groups/7/-/packages/npm/
//gitlab.minilab/api/v4/groups/7/-/packages/npm/:_authToken=YOUR_PAT_TOKEN
```

Then install:

```bash
cd frontend/transport-portal
npm install @halolabs/ngx-popout
```

**Why**: The library provides `PopOutManagerService` (low-level portal management) and `PopOutOrchestrator` (high-level consumer API). We'll use the orchestrator for minimal boilerplate.

---

## Step 2: Import PopoutModule in AppModule

**File**: `src/app/app.module.ts`

Add `PopoutModule` to imports. This re-exports Angular CDK's `PortalModule`, which the library needs for `DomPortalOutlet`.

```typescript
import { PopoutModule } from '@halolabs/ngx-popout';

@NgModule({
  imports: [
    // ... existing imports
    PopoutModule,     // <-- ADD THIS
  ],
  // ...
})
export class AppModule {}
```

**Why**: `PopoutModule` makes CDK portal infrastructure available to the application. Without it, the library can't create `DomPortalOutlet` instances to render components into popout windows.

**Note**: We do NOT add `PopOutManagerService` or `PopOutOrchestrator` to the module's `providers` array. These services are provided per-component (in the host component's `@Component.providers`), so each host gets its own instance with its own popout tracking.

---

## Step 3: Create a Popout-Ready Version of the Results Table

The existing `ResultsTableComponent` works inline — it receives data via `@Input()` bindings from its parent template. When it's rendered inside a popout window via CDK portal, there's no parent template re-evaluating those bindings. The orchestrator's `syncInputs()` handles this, but the component needs to be declared in the module so Angular can create it dynamically.

The simplest approach: **use the existing component directly as the popout target**. No wrapper needed — the orchestrator sets @Input properties on whatever component you give it.

**No new file needed.** The existing `ResultsTableComponent` already:
- Accepts data via `@Input()` properties
- Implements `OnChanges` (reacts to input changes)
- Emits actions via `@Output()` EventEmitters

The library auto-wires all `@Output()` EventEmitters as messages on `orchestrator.messages$`.

---

## Step 4: Add Popout Services to the Search Page Component

**File**: `src/app/features/search/pages/search-page/search-page.component.ts`

This is the host component — the page that contains the results table and statistics. We add the orchestrator here.

### 4a: Add imports

```typescript
import { Injector } from '@angular/core';
import { PopOutManagerService, PopOutOrchestrator } from '@halolabs/ngx-popout';
```

**Why**: `PopOutOrchestrator` is our high-level API. `PopOutManagerService` must also be provided because the orchestrator depends on it via DI.

### 4b: Provide services per-component

```typescript
@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  providers: [PopOutManagerService, PopOutOrchestrator],   // <-- ADD THIS
})
```

**Why**: Providing at the component level (not module level) means each instance of `SearchPageComponent` gets its own popout manager. If you had two search pages open simultaneously, their popouts wouldn't collide. This is the same pattern used for component-scoped services throughout Angular.

### 4c: Inject the orchestrator and register popout targets

```typescript
constructor(
  private stateService: StateManagementService,
  public popouts: PopOutOrchestrator,          // <-- ADD THIS
  private injector: Injector                    // <-- ADD THIS
) {}

ngOnInit(): void {
  // Existing state subscription
  this.subscription = this.state$.subscribe((state) => {
    this.state = state;
  });

  // Register popout-able components
  this.popouts.register('results', ResultsTableComponent, { width: 1400, height: 800 });
  this.popouts.initialize(this.injector);

  // When a popout is closed, the component re-appears inline (handled by template *ngIf)
  this.popouts.closed$.subscribe(popoutId => {
    console.log(`Popout "${popoutId}" closed — component returns inline`);
  });
}
```

**Why `this.injector`**: The orchestrator passes this to `PopOutManagerService.initialize()`. Portal-rendered components inherit this injector's DI context — meaning they can access the same `StateManagementService`, `ApiService`, and other services that the host component uses. Without this, the popout component would be an orphan with no access to application services.

**Why `register()` in ngOnInit**: Registration is a declaration — "this popoutId maps to this component class with these default window features." It doesn't open anything. You call it once, then `toggle()` whenever the user wants to pop out.

### 4d: Add the toggle method

```typescript
toggleResultsPopout(): void {
  this.popouts.toggle('results', {
    vehicles: this.vehicles,
    loading: this.loading,
    totalRecords: this.totalRecords,
    currentPage: this.currentPage,
    pageSize: this.pageSize,
    filterRegistration: this.currentFilters.filterRegistration || '',
    filterManufacturer: this.currentFilters.filterManufacturer || '',
    filterModel: this.currentFilters.filterModel || '',
    filterYearMin: this.currentFilters.filterYearMin || null,
    filterYearMax: this.currentFilters.filterYearMax || null,
    filterCategory: this.currentFilters.filterCategory || '',
    filterState: this.currentFilters.filterState || '',
    title: 'Aircraft Search Results',
  });
}
```

**Why we pass all @Input values**: When the orchestrator opens a popout, it calls `openPopOut(popoutId, componentType, data)`. The `data` object's keys are set directly on the component instance as properties. This is the initial data load — equivalent to what the template bindings would provide on first render.

### 4e: Keep popout data in sync

When the search results change (user searches again, changes page, etc.), the popout needs to know. Add this to the state subscription:

```typescript
ngOnInit(): void {
  this.subscription = this.state$.subscribe((state) => {
    this.state = state;

    // Sync data to the results popout if it's open
    if (this.popouts.isOpen('results')) {
      this.popouts.syncInputs('results', {
        vehicles: state.results,
        loading: state.loading,
        totalRecords: state.totalResults,
        currentPage: state.filters.page || 1,
        pageSize: state.filters.size || 20,
      });
    }
  });

  // ... rest of ngOnInit
}
```

**Why `syncInputs` instead of just setting properties**: `syncInputs()` does three things that direct property assignment doesn't:
1. Sets the properties on the component instance
2. Builds `SimpleChanges` objects for each changed property
3. Calls `ngOnChanges()` on the component (if it implements it)
4. Runs `detectChanges()` to flush the view

Portal-rendered components have no parent template — Angular's normal change detection won't re-evaluate their bindings. `syncInputs()` simulates what Angular would do if the component were in a template with `[vehicles]="state.results"`.

---

## Step 5: Add Popout Toggle Button to the Template

**File**: `src/app/features/search/pages/search-page/search-page.component.html`

### 5a: Add a toggle button next to the results header

```html
<div class="results-header">
  <h2>Results</h2>
  <p class="results-count">{{ totalRecords }} aircraft found</p>
  <button
    class="popout-toggle"
    (click)="toggleResultsPopout()"
    [title]="popouts.isOpen('results') ? 'Return results to this window' : 'Open results in new window'">
    {{ popouts.isOpen('results') ? 'Pop In' : 'Pop Out' }}
  </button>
</div>
```

**Why the button text changes**: `popouts.isOpen('results')` returns true when the results table is in a separate window. The toggle button serves as both "pop out" and "pop in" — calling `toggle()` again closes the popout and the inline component re-appears.

### 5b: Hide inline component when popped out

Wrap the results table in a condition that hides it when the popout is open:

```html
<!-- Results Table -->
<app-results-table
  *ngIf="!popouts.isOpen('results')"
  [vehicles]="vehicles"
  [loading]="loading"
  ...
></app-results-table>
```

**Why**: Without this, the user would see the results both inline AND in the popout window. `*ngIf` destroys the inline instance when the popout is open, and recreates it when the popout closes. The orchestrator's `closed$` subscription ensures the template re-evaluates.

**Alternative**: You could use `[hidden]` instead of `*ngIf` to keep the inline component alive (avoiding reconstruction cost). But `*ngIf` is simpler and the results table reconstructs quickly from its @Input data.

---

## Step 6: Handle @Output Events from Popout

When the results table is in a popout window, its `@Output()` EventEmitters still fire — the library auto-wires them as messages on `orchestrator.messages$`. The popout component might emit `sortChange`, `pageChange`, `filterChange`, etc.

Add a message handler:

```typescript
ngOnInit(): void {
  // ... existing code ...

  // Handle events from popped-out results table
  this.popouts.messages$.subscribe(({ popoutId, message }) => {
    if (popoutId === 'results' && message.type === 'COMPONENT_OUTPUT') {
      const { outputName, data } = message.payload;
      switch (outputName) {
        case 'pageChange':
          this.onPageChange(data);
          break;
        case 'pageSizeChange':
          this.onPageSizeChange(data);
          break;
        case 'sortChange':
          this.onSortChange(data);
          break;
        case 'filterChange':
          this.onFilterChange(data);
          break;
        case 'viewDetails':
          this.onViewDetails(data);
          break;
      }
    }
  });
}
```

**Why**: In the normal inline flow, the template handles this with `(pageChange)="onPageChange($event)"`. But in a popout, there's no template binding — the component is rendered via CDK portal. The library detects all `@Output()` EventEmitters on the component (via reflection), subscribes to them, and relays each emission as a `COMPONENT_OUTPUT` message with the output name and payload. This message handler bridges the gap.

**Important**: The message handler calls the same methods that the template bindings would call (`onPageChange`, `onSortChange`, etc.). The rest of the application — state management, API calls, URL updates — works exactly the same regardless of whether the component is inline or in a popout.

---

## Step 7: Verify

1. **Start the dev server**: `ng serve --host 0.0.0.0 --port 4300 --disable-host-check`
2. **Search for aircraft** (e.g., manufacturer "Cessna")
3. **Click "Pop Out"** next to the results header
4. **Verify**: A new browser window opens showing the results table with the same data
5. **Change page** in the popout — the main window should react (URL updates, state changes)
6. **Search again** in the main window — the popout table should update with new results
7. **Close the popout window** — the results table should reappear inline
8. **Click "Pop Out" again** — should work repeatedly

---

## What the Library Handles (You Don't Write This)

- **Style synchronization**: All CSS from the main window is copied to the popout, including late-injected styles (e.g., from lazy-loaded components)
- **Keyboard forwarding**: `keydown`/`keyup` events in the popout are forwarded to the main window's document
- **Drag event forwarding**: Mouse drag events (for libraries like Plotly) are forwarded between windows
- **Change detection**: `syncInputs()` triggers `ngOnChanges` and `detectChanges` automatically
- **Cleanup**: Closing the popout detaches the CDK portal, closes the BroadcastChannel, stops all observers

---

## Summary of Changes

| File | Change | Lines |
|------|--------|-------|
| `package.json` | Add `@halolabs/ngx-popout` dependency | 1 |
| `.npmrc` | Add registry config | 2 |
| `app.module.ts` | Import `PopoutModule` | 2 |
| `search-page.component.ts` | Add providers, inject orchestrator, register + toggle + sync + messages | ~30 |
| `search-page.component.html` | Add toggle button, add `*ngIf` to hide inline when popped out | ~8 |

**Total consumer code**: ~40 lines across 2 files (plus 3 lines of config).
