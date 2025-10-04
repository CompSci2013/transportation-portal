# REQ-2025-003 Dependency Tree & Branch Strategy

## Dependency Analysis

```
                                    main
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
            feature/statistics              feature/statistics-backend
                    │                                 │
        ┌───────────┼───────────┐          ┌─────────┼─────────┐
        │           │           │          │         │         │
    Branch 1    Branch 2    Branch 3   Branch 4  Branch 5  Branch 6
    Frontend    Frontend    Frontend   Backend   Backend   Backend
     Base      Analytics    Export      API       Cache    Export
        │           │           │          │         │         │
        │           │           │          │         │         │
        └───────────┴───────────┴──────────┴─────────┴─────────┘
                                     │
                              feature/statistics
                              (integration branch)
                                     │
                                   main
```

## Branch Structure

### **Parallel Track 1: Backend (Can Start Immediately)**

**Branch 4: `feature/stats-backend-api`**
- **Purpose:** Core API endpoints
- **Dependencies:** None (uses existing Elasticsearch)
- **Deliverables:**
  - GET /api/v1/statistics/summary
  - GET /api/v1/statistics/geographic
  - GET /api/v1/statistics/manufacturers
  - GET /api/v1/statistics/fleet-age
  - GET /api/v1/statistics/technical
- **Files:**
  - `backend/src/routes/statistics.routes.js`
  - `backend/src/controllers/statistics.controller.js`
  - `backend/src/services/statistics.service.js`
- **Estimated:** 8 hours
- **Can work in parallel with:** All other branches

**Branch 5: `feature/stats-backend-cache`**
- **Purpose:** Redis caching layer
- **Dependencies:** Branch 4 (needs API endpoints to cache)
- **Deliverables:**
  - Redis integration
  - Cache key strategy
  - TTL configuration
  - Cache invalidation logic
- **Files:**
  - `backend/src/services/cache.service.js`
  - `backend/src/middleware/cache.middleware.js`
- **Estimated:** 2 hours
- **Can work in parallel with:** Frontend branches

**Branch 6: `feature/stats-backend-export`**
- **Purpose:** Export functionality (CSV, PDF)
- **Dependencies:** Branch 4 (needs data endpoints)
- **Deliverables:**
  - GET /api/v1/statistics/export
  - CSV generation
  - PDF generation (server-side)
- **Files:**
  - `backend/src/controllers/export.controller.js`
  - `backend/src/services/export.service.js`
- **Estimated:** 4 hours
- **Can work in parallel with:** Frontend branches (except Branch 3)

---

### **Parallel Track 2: Frontend (Can Start Immediately)**

**Branch 1: `feature/stats-frontend-base`**
- **Purpose:** Page structure, routing, state management
- **Dependencies:** None
- **Deliverables:**
  - `/statistics` route
  - statistics-page.component
  - statistics.service (shell with mock data)
  - StateManagementService extension
  - Key metrics panel component
  - Basic layout/grid structure
- **Files:**
  - `frontend/src/app/features/statistics/pages/statistics-page/`
  - `frontend/src/app/features/statistics/services/statistics.service.ts`
  - `frontend/src/app/features/statistics/components/key-metrics-panel/`
  - `frontend/src/app/app-routing.module.ts`
- **Estimated:** 6 hours
- **Can work in parallel with:** All branches

**Branch 2: `feature/stats-frontend-analytics`**
- **Purpose:** All visualization components
- **Dependencies:** Branch 1 (needs page structure)
- **Deliverables:**
  - Geographic map component (Leaflet)
  - Manufacturer bar chart (Recharts)
  - Fleet age histogram
  - Temporal timeline
  - Category donut chart
  - Technical specs table
  - Treemap component
  - Cross-chart filtering logic
- **Files:**
  - `frontend/src/app/features/statistics/components/geographic-map/`
  - `frontend/src/app/features/statistics/components/manufacturer-chart/`
  - `frontend/src/app/features/statistics/components/fleet-age-histogram/`
  - `frontend/src/app/features/statistics/components/temporal-timeline/`
  - `frontend/src/app/features/statistics/components/category-donut/`
  - `frontend/src/app/features/statistics/components/technical-specs-table/`
  - `frontend/src/app/features/statistics/components/model-treemap/`
- **Package installations:**
  - `npm install recharts leaflet react-leaflet @types/leaflet`
- **Estimated:** 18 hours
- **Can work in parallel with:** Backend branches

**Branch 3: `feature/stats-frontend-export`**
- **Purpose:** Export dialog and client-side export functionality
- **Dependencies:** Branch 2 (needs charts to export), Branch 6 (needs backend export endpoint)
- **Deliverables:**
  - Export dialog component
  - PNG chart capture (html2canvas)
  - CSV client-side generation
  - PDF generation integration
  - Share URL functionality
- **Files:**
  - `frontend/src/app/features/statistics/components/export-dialog/`
- **Package installations:**
  - `npm install jspdf html2canvas papaparse`
- **Estimated:** 4 hours
- **Can work in parallel with:** None (requires Branch 2 + 6)

---

## Dependency Graph

```
Timeline →

Week 1:
┌─────────────────────┐  ┌─────────────────────┐
│ Branch 4: Backend   │  │ Branch 1: Frontend  │
│ API Endpoints       │  │ Base + Layout       │
│ (parallel)          │  │ (parallel)          │
└──────────┬──────────┘  └──────────┬──────────┘
           │                        │
           ↓                        ↓
┌─────────────────────┐  ┌─────────────────────┐
│ Branch 5: Cache     │  │ Branch 2: Frontend  │
│ (depends on 4)      │  │ Analytics Charts    │
│                     │  │ (depends on 1)      │
└─────────────────────┘  └──────────┬──────────┘
                                    │
Week 2:                             │
┌─────────────────────┐             │
│ Branch 6: Export    │             │
│ Backend             │             │
│ (depends on 4)      │             │
└──────────┬──────────┘             │
           │                        │
           └────────┬───────────────┘
                    ↓
          ┌─────────────────────┐
          │ Branch 3: Frontend  │
          │ Export Dialog       │
          │ (depends on 2 & 6)  │
          └──────────┬──────────┘
                     │
                     ↓
            ┌────────────────┐
            │ Integration    │
            │ Testing        │
            └────────────────┘
```

---

## Parallel Execution Strategy

### **Day 1-2: Simultaneous Start**
- **Developer A (Backend):** Branch 4 - API endpoints
- **Developer B (Frontend):** Branch 1 - Base structure

### **Day 3-5: Parallel Development**
- **Developer A:** Branch 5 (Cache) → Branch 6 (Export backend)
- **Developer B:** Branch 2 (All charts and visualizations)

### **Day 6-7: Final Integration**
- **Developer B:** Branch 3 (Export dialog) - requires Branch 2 & 6 complete
- **Both:** Integration testing, bug fixes

### **Day 8: Merge Strategy**
1. Merge Branch 4 → `feature/statistics-backend`
2. Merge Branch 5 → `feature/statistics-backend`
3. Merge Branch 6 → `feature/statistics-backend`
4. Merge Branch 1 → `feature/statistics`
5. Merge Branch 2 → `feature/statistics`
6. Merge `feature/statistics-backend` → `feature/statistics`
7. Merge Branch 3 → `feature/statistics`
8. Integration testing on `feature/statistics`
9. Merge `feature/statistics` → `main`

---

## Critical Path

**The critical path (longest dependent chain):**
```
Branch 1 (Base) → Branch 2 (Charts) → Branch 3 (Export) = 28 hours
```

**With parallel execution:**
- Backend branches (4→5, 4→6) can complete while frontend is building
- Total calendar time: ~8 working days (assuming single developer on each track)

---

## Mock Data Strategy

**For parallel development, Branch 1 and 2 can use mock data:**

```typescript
// frontend/src/app/features/statistics/services/statistics.service.mock.ts
export const MOCK_SUMMARY = {
  totalAircraft: 4607,
  activeManufacturers: 21,
  uniqueModels: 156,
  statesWithAircraft: 50,
  avgAircraftAge: 28.3,
  mostCommonCategory: "Fixed_wing_single",
  lastUpdated: "2025-10-04T00:00:00Z"
};
```

**Once Branch 4 is merged, swap mock service for real HTTP calls.**

---

## Recommendation

**Optimal execution with 1 developer (you):**

1. **Tag current state** as baseline
2. **Start Branch 4** (backend API) - 1 day
3. **Start Branch 1** (frontend base) - 1 day  
4. **Continue Branch 2** (frontend charts) - 2-3 days
5. **Add Branch 5** (cache) - 0.5 day
6. **Add Branch 6** (export backend) - 0.5 day
7. **Finish Branch 3** (export frontend) - 0.5 day
8. **Integration & testing** - 1 day

**Total: 6.5-8 developer days**
