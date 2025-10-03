~/projects/transportation/frontend/transport-portal/src/
├── app/
│   ├── app.module.ts                          # Root module with APP_INITIALIZER
│   ├── app-routing.module.ts                   # Routes
│   ├── app.component.ts                        # Root component
│   │
│   ├── core/                                   # Singleton services (provided in root)
│   │   ├── services/
│   │   │   ├── storage.service.ts              # Elasticsearch user preferences (NOT localStorage)
│   │   │   ├── route-state.service.ts          # URL parameter sync
│   │   │   ├── state-management.service.ts     # Main state orchestrator
│   │   │   ├── user-preferences.service.ts     # Backend API for user prefs
│   │   │   └── transport-api.service.ts        # HTTP calls to backend (already exists)
│   │   │
│   │   └── core.module.ts                      # Optional: organize core services
│   │
│   ├── shared/                                 # Reusable components/pipes/directives
│   │   ├── components/
│   │   │   ├── loading-spinner/
│   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   └── loading-spinner.component.scss
│   │   │   │
│   │   │   └── error-message/
│   │   │       ├── error-message.component.ts
│   │   │       └── error-message.component.scss
│   │   │
│   │   ├── pipes/
│   │   │   └── safe-key.pipe.ts                # For keyvalue pipe with types
│   │   │
│   │   └── shared.module.ts
│   │
│   ├── models/                                 # TypeScript interfaces
│   │   ├── aircraft.model.ts                   # Already exists
│   │   ├── search-filters.model.ts             # NEW: SearchFilters interface
│   │   ├── search-state.model.ts               # NEW: SearchState interface
│   │   ├── search-statistics.model.ts          # NEW: SearchStatistics, SearchResponse
│   │   └── user-preferences.model.ts           # NEW: UserPreferences interface
│   │
│   ├── features/                               # Feature modules
│   │   │
│   │   ├── search/                             # Search feature
│   │   │   ├── search-routing.module.ts
│   │   │   ├── search.module.ts
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   └── search-page/
│   │   │   │       ├── search-page.component.ts        # Layout container
│   │   │   │       ├── search-page.component.html
│   │   │   │       └── search-page.component.scss
│   │   │   │
│   │   │   └── components/
│   │   │       ├── aircraft-search/            # Search form (refactor existing)
│   │   │       │   ├── aircraft-search.component.ts
│   │   │       │   ├── aircraft-search.component.html
│   │   │       │   └── aircraft-search.component.scss
│   │   │       │
│   │   │       ├── results-table/              # Paginated table
│   │   │       │   ├── results-table.component.ts
│   │   │       │   ├── results-table.component.html
│   │   │       │   └── results-table.component.scss
│   │   │       │
│   │   │       ├── pagination/                 # Pagination controls
│   │   │       │   ├── pagination.component.ts
│   │   │       │   ├── pagination.component.html
│   │   │       │   └── pagination.component.scss
│   │   │       │
│   │   │       ├── histogram/                  # Reusable histogram
│   │   │       │   ├── histogram.component.ts
│   │   │       │   ├── histogram.component.html
│   │   │       │   └── histogram.component.scss
│   │   │       │
│   │   │       └── results-summary/            # "Found X results" banner
│   │   │           ├── results-summary.component.ts
│   │   │           ├── results-summary.component.html
│   │   │           └── results-summary.component.scss
│   │   │
│   │   ├── aircraft-detail/                    # Detail page feature
│   │   │   ├── aircraft-detail-routing.module.ts
│   │   │   ├── aircraft-detail.module.ts
│   │   │   └── pages/
│   │   │       └── aircraft-detail-page/
│   │   │           ├── aircraft-detail-page.component.ts
│   │   │           ├── aircraft-detail-page.component.html
│   │   │           └── aircraft-detail-page.component.scss
│   │   │
│   │   └── statistics/                         # Statistics dashboard feature
│   │       ├── statistics-routing.module.ts
│   │       ├── statistics.module.ts
│   │       └── pages/
│   │           └── statistics-dashboard/
│   │               ├── statistics-dashboard.component.ts
│   │               ├── statistics-dashboard.component.html
│   │               └── statistics-dashboard.component.scss
│   │
│   └── environments/
│       ├── environment.ts                       # Already exists
│       └── environment.prod.ts
