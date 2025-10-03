## Brownfield Migration Guide: State Management Pattern

**Goal**: Incrementally adopt the new state management pattern without breaking existing functionality.

---

## Phase 0: Preparation (No Code Changes)

**Server**: Your workstation  
**Action**: Analysis and planning

```bash
cd /home/odin/projects/transportation
mkdir -p docs/migration
touch docs/migration/component-inventory.md
```

**Create component inventory**:
1. List all existing components
2. Identify which components share state
3. Map current state management approach (services, @Input/@Output, shared observables, etc.)
4. Identify "leaf" components (no children) vs "container" components
5. Mark which components read URL params currently

**What this achieves**: Understanding the landscape before changes begin.

---

## Phase 1: Add Infrastructure (Non-Breaking)

**Server**: Thor  
**Directory**: /home/odin/projects/transportation/frontend/src/app/

```bash
# Create new services (don't use them yet)
mkdir -p core/services
touch core/services/storage.service.ts
touch core/services/route-state.service.ts
touch core/services/state-management.service.ts
```

**Implementation order**:

### 1a. Add StorageService
```typescript
// Implement exactly as shown in the reference doc
// TEST: Write unit tests, verify it works independently
```

### 1b. Add RouteStateService  
```typescript
// Implement exactly as shown in the reference doc
// TEST: Create a dummy component that reads/writes URL params
//       Verify back/forward buttons work
```

### 1c. Add StateManagementService (Minimal)
```typescript
// Start with ONLY the filters$ observable
// Don't migrate existing state yet
@Injectable({ providedIn: 'root' })
export class StateManagementService {
  private filtersSubject = new BehaviorSubject<SearchFilters>({});
  public filters$ = this.filtersSubject.asObservable();
  
  constructor(
    private storage: StorageService,
    private routeState: RouteStateService
  ) {
    // Sync URL to filters (but don't trigger actions yet)
    this.routeState.queryParams$.subscribe(params => {
      const filters = this.routeState.paramsToFilters(params);
      this.filtersSubject.next(filters);
    });
  }
}
```

**Critical**: These services exist but **nothing uses them yet**. Application continues working normally.

---

## Phase 2: Parallel Operation (Bridge Pattern)

Create adapter/bridge services that connect old and new patterns:

```typescript
// core/services/legacy-bridge.service.ts
@Injectable({ providedIn: 'root' })
export class LegacyBridgeService {
  constructor(
    private newState: StateManagementService,
    private oldSearchService: OldSearchService // Your existing service
  ) {
    // Forward new state changes to old system
    this.newState.filters$.subscribe(filters => {
      this.oldSearchService.updateFilters(filters);
    });
    
    // Forward old state changes to new system (if bidirectional)
    this.oldSearchService.filters$.subscribe(filters => {
      this.newState.updateFilters(filters);
    });
  }
}
```

Inject `LegacyBridgeService` in AppModule to start the bridge:
```typescript
export class AppModule {
  constructor(private bridge: LegacyBridgeService) {
    // Bridge initializes in constructor
  }
}
```

**What this achieves**: Both systems see the same state. Components can migrate one at a time.

---

## Phase 3: Migrate Components (One at a Time)

**Start with leaf components** (no children, simple logic):

### Migration Checklist for Each Component:

```typescript
// BEFORE (Old Pattern)
export class OldComponent {
  constructor(private oldService: OldSearchService) {}
  
  ngOnInit() {
    this.oldService.results$.subscribe(results => {
      this.results = results;
    });
  }
  
  search() {
    this.oldService.search({ q: this.query });
  }
}

// AFTER (New Pattern)
export class NewComponent {
  results$ = this.state.results$; // Use async pipe
  
  constructor(private state: StateManagementService) {}
  
  search() {
    this.state.updateFilters({ q: this.query });
  }
}
```

**Template changes**:
```html
<!-- BEFORE -->
<div *ngFor="let result of results">

<!-- AFTER -->
<div *ngFor="let result of results$ | async">
```

**Test each migration**:
1. Component displays correctly
2. User interactions work
3. URL updates properly
4. Back/forward buttons work
5. Page refresh preserves state

**Commit after each component**: `git commit -m "Migrate ComponentName to new state management"`

---

## Phase 4: Remove Bridge (After All Components Migrated)

Once ALL components use the new pattern:

```typescript
// Delete LegacyBridgeService
// Remove old services (OldSearchService, etc.)
// Clean up old @Input/@Output chains
```

**Verify**: Full regression test of entire application.

---

## Migration Strategies by Scenario

### Scenario A: Simple Display Component
**Effort**: Low  
**Risk**: Low

```typescript
// Just change data source
// Before: this.oldService.data$
// After:  this.state.data$
```

### Scenario B: Form Component with Filters
**Effort**: Medium  
**Risk**: Medium

```typescript
// Add form hydration from URL
ngOnInit() {
  this.state.filters$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(filters => {
    this.form.patchValue(filters, { emitEvent: false });
  });
  
  this.form.valueChanges.pipe(
    debounceTime(300),
    takeUntil(this.destroy$)
  ).subscribe(value => {
    this.state.updateFilters(value);
  });
}
```

### Scenario C: Parent-Child Communication
**Effort**: High (but worth it)  
**Risk**: Medium

```typescript
// BEFORE: @Input/@Output chains
@Component({
  template: '<child [data]="parentData" (change)="onChildChange($event)">'
})
export class Parent {
  @Input() parentData: Data;
  onChildChange(event) { /* complex logic */ }
}

// AFTER: Shared state
@Component({
  template: '<child>' // No bindings needed
})
export class Parent {
  // Child reads from state directly
  // No coordination needed
}

export class Child {
  data$ = this.state.data$; // Gets data from state
  
  onChange(value) {
    this.state.updateData(value); // Parent sees it automatically
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('ComponentUnderMigration', () => {
  let mockState: jasmine.SpyObj<StateManagementService>;
  
  beforeEach(() => {
    mockState = jasmine.createSpyObj('StateManagementService', 
      ['updateFilters'], 
      { filters$: of({ q: 'test' }) }
    );
    
    TestBed.configureTestingModule({
      providers: [
        { provide: StateManagementService, useValue: mockState }
      ]
    });
  });
  
  it('should update filters on search', () => {
    component.search('boeing');
    expect(mockState.updateFilters).toHaveBeenCalledWith({ q: 'boeing' });
  });
});
```

### Integration Tests
- Test URL changes propagate to components
- Test browser back/forward buttons
- Test page refresh preserves state
- Test multi-component synchronization

---

## Rollback Plan

If migration causes issues:

```bash
# Revert last commit
git revert HEAD

# Or revert specific component
git checkout HEAD~1 -- src/app/features/problematic-component/

# Push rollback
git push origin main
git push github main
```

**Key**: Small, frequent commits allow surgical rollbacks.

---

## Timeline Estimate

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 0: Analysis | 1-2 days | Low |
| Phase 1: Infrastructure | 2-3 days | Low |
| Phase 2: Bridge | 1-2 days | Medium |
| Phase 3: Component Migration | 1-2 days per component | Varies |
| Phase 4: Cleanup | 1 day | Low |

**For 10-component app**: ~3-4 weeks with testing  
**For 50-component app**: ~8-12 weeks with testing

---

## Red Flags (Stop and Reassess)

- Multiple components breaking after one migration
- URL becoming too long (>2000 characters)
- Performance degradation
- State getting out of sync between components
- Team confusion about which pattern to use

---

## Success Criteria

✅ All components use StateManagementService  
✅ URL reflects all searchable state  
✅ Browser back/forward buttons work correctly  
✅ Page refresh preserves user's work  
✅ URLs are shareable and restore exact state  
✅ No @Input/@Output chains for state data  
✅ All old state services removed  

---

**Save this guide**:


This guide prioritizes **safety** (non-breaking changes), **incrementalism** (one component at a time), and **reversibility** (easy rollback).
