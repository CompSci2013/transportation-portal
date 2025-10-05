# REQUIREMENTS DOCUMENT

**Project:** Transportation Portal - Statistics Dashboard Implementation  
**Request ID:** REQ-2025-003  
**Date:** October 4, 2025  
**Requested By:** Client (Halo Labs)  
**Prepared By:** Development Team  
**Related:** REQ-2025-002 (Manufacturer-State Picker), CR-2025-001 (Generic Transport Architecture)

---

## EXECUTIVE SUMMARY

Implement a comprehensive Statistics dashboard providing analytical insights into the aircraft registry dataset. The dashboard will present fleet composition, geographic distribution, manufacturer analytics, temporal trends, and technical specifications through interactive visualizations and key performance indicators.

---

## BUSINESS JUSTIFICATION

**Current State:**
- Statistics section exists below search results on search page
- Limited to two basic histograms (Aircraft by Manufacturer, Models by Manufacturer)
- No standalone analytics experience
- No temporal trend analysis or geographic visualization
- Users cannot explore dataset characteristics without performing searches

**User Need:**
- Understand overall dataset composition and trends
- Identify patterns in aircraft registrations across geography and time
- Analyze manufacturer market share and model popularity
- Assess fleet age and modernization trends
- Export statistical insights for reporting

**Business Value:**
- Increases user engagement through data exploration
- Provides market intelligence to aviation stakeholders
- Demonstrates platform sophistication and data depth
- Enables data-driven decision making for fleet management
- Supports academic and industry research use cases

---

## FUNCTIONAL REQUIREMENTS

### FR-1: Key Metrics Summary Panel

**Layout:**
```
┌────────────┬────────────┬────────────┬────────────┐
│ Total      │ Active     │ Manufac-   │ States     │
│ Aircraft   │ Manufac-   │ turers     │ with       │
│            │ turers     │            │ Aircraft   │
│ 4,607      │ 42         │ 21 (top)   │ 50         │
└────────────┴────────────┴────────────┴────────────┘
```

**Metrics to Display:**
- Total aircraft count in registry
- Number of unique manufacturers
- Number of unique models
- Number of states with registrations
- Average aircraft age (years)
- Most common category (e.g., "Fixed_wing_single")

**Styling:**
- Large, prominent numbers (48-72px font size)
- Subtitle labels below each metric
- Optional trend indicators (↑/↓ with percentage if historical data available)
- Fixed-width layout optimized for 1920x1080 desktop displays

---

### FR-2: Geographic Distribution Visualization

#### FR-2.1: State Choropleth Map

**Requirements:**
- Interactive US map showing aircraft concentration by state
- Color gradient: light (low count) → dark (high count)
- Hover tooltip displays: State name, Aircraft count, Percentage of total
- Click state → filter to show manufacturers/models for that state

**Data Source:**
- Aggregation query: `SELECT state, COUNT(*) FROM transport_unified WHERE transport_type='plane' GROUP BY state`

**Color Scale:**
- 0-50 aircraft: Light blue (#E3F2FD)
- 51-200: Medium blue (#64B5F6)
- 201-500: Dark blue (#1976D2)
- 501+: Navy (#0D47A1)

**Dimensions:**
- Map width: 800-1000px
- Map height: 600-700px
- Fixed aspect ratio maintained

#### FR-2.2: Top States Table

**Columns:**
| Rank | State | Count | % of Total | Top Manufacturer |
|------|-------|-------|------------|------------------|
| 1    | CA    | 892   | 19.4%      | Cessna           |
| 2    | TX    | 754   | 16.4%      | Cessna           |

**Features:**
- Display top 10 states by default
- "Show All" button expands to full 50-state list
- Sortable columns (click header to sort)
- Search filter to find specific state
- Fixed width table: 900px

---

### FR-3: Manufacturer & Model Analytics

#### FR-3.1: Manufacturer Market Share

**Visualization:** Horizontal bar chart (current implementation enhanced)

**Enhancements to Current:**
- Add percentage labels on bars
- Include "Other" category for manufacturers with <1% share
- Color coding: Top 3 manufacturers distinct colors, rest gradient
- Click bar → drill down to models for that manufacturer

**Data Display:**
```
Cessna         ████████████████████ 1,245 (27.0%)
Boeing         ████████████ 687 (14.9%)
Piper          ██████████ 542 (11.8%)
Beechcraft     ████████ 423 (9.2%)
[...rest...]
Other (17)     ██████ 310 (6.7%)
```

**Dimensions:**
- Chart width: 600px
- Chart height: 400px (scrollable if >20 manufacturers)

#### FR-3.2: Model Popularity Matrix

**Visualization:** Treemap showing model distribution

**Structure:**
- Top level: Manufacturers (size = total aircraft)
- Second level: Models within each manufacturer
- Hover shows: Manufacturer, Model, Count, % of manufacturer total
- Click model → navigate to search page pre-filtered for that model

**Example Layout:**
```
┌─────────────────────────────────┐
│ Cessna                          │
│ ┌──────┬─────┬────┬────┬─────┐ │
│ │ 172S │152  │182 │... │     │ │
│ └──────┴─────┴────┴────┴─────┘ │
├─────────────────┬───────────────┤
│ Boeing          │ Piper         │
│ ┌─────┬────┐   │ ┌────┬─────┐ │
│ │ 737 │... │   │ │PA28│...  │ │
│ └─────┴────┘   │ └────┴─────┘ │
└─────────────────┴───────────────┘
```

**Dimensions:**
- Treemap width: 900px
- Treemap height: 500px

---

### FR-4: Fleet Age & Temporal Analysis

#### FR-4.1: Fleet Age Distribution

**Visualization:** Histogram with age bins

**Bins (X-axis):**
- Pre-1950 (Vintage)
- 1950-1969 (Classic)
- 1970-1989 (Mature)
- 1990-2009 (Modern)
- 2010-2025 (Current)

**Y-axis:** Number of aircraft

**Interactivity:**
- Hover shows bin range and count
- Click bin → filter dashboard to show manufacturers/states for that age range
- Toggle between absolute count and percentage view

**Dimensions:**
- Chart width: 700px
- Chart height: 400px

#### FR-4.2: Manufacturing Year Timeline

**Visualization:** Line chart showing aircraft manufactured per year

**X-axis:** Years (1910-2025)
**Y-axis:** Number of aircraft

**Features:**
- Identify production peaks and valleys
- Highlight significant aviation milestones (optional overlay)
- Range selector: Drag to zoom into specific time period
- Show total aircraft manufactured in selected range

**Dimensions:**
- Chart width: 1000px
- Chart height: 400px

---

### FR-5: Technical Specifications Dashboard

#### FR-5.1: Category Breakdown

**Visualization:** Donut chart

**Categories:**
- Fixed_wing_single
- Fixed_wing_multi
- Rotorcraft (helicopters)
- Glider
- Balloon
- Other/Experimental

**Display:**
- Center shows total count
- Segments labeled with category name and percentage
- Legend on right side
- Click segment → highlight in other charts

**Dimensions:**
- Chart diameter: 400px
- Legend width: 200px

#### FR-5.2: Engine & Fuel Type Analysis

**Visualization:** Grouped bar chart

**Groups:**
- Engine Type: Reciprocating, Turboprop, Turbojet, Turbofan, Electric
- Fuel Type: Gasoline, Jet Fuel, Diesel, Electric, Hybrid

**Display:**
- Side-by-side bars for comparison
- Counts and percentages
- Filter capability: Show only specific types

**Dimensions:**
- Chart width: 600px
- Chart height: 400px

#### FR-5.3: Technical Specifications Table

**Columns:**
| Specification | Min | Max | Average | Median |
|---------------|-----|-----|---------|--------|
| Year          | 1910| 2025| 1987    | 1994   |
| Capacity      | 1   | 350 | 4.2     | 2      |
| Power (hp)    | 50  | 7500| 215     | 180    |

**Features:**
- Display statistics for numeric fields
- Optional: Distribution sparkline in each row

**Dimensions:**
- Table width: 800px

---

### FR-6: Data Quality & Coverage Metrics

**Purpose:** Transparency about data completeness

**Metrics to Display:**
- Total records in database
- Last data update timestamp
- Completeness percentages for key fields:
  - Manufacturer: 99.8%
  - Model: 98.5%
  - Year: 95.2%
  - State: 100%
  - Engine type: 78.4%
  
**Visualization:** Progress bars showing completeness

**Dimensions:**
- Panel width: 400px
- Located in sidebar or bottom panel

---

### FR-7: Interactive Filtering & Cross-Chart Selection

**Global Filter Panel:**
```
┌─────────────────────────────────────────┐
│ Filters Active:                         │
│ [State: CA] [x]  [Year: 2000-2025] [x] │
│ Clear All Filters                       │
└─────────────────────────────────────────┘
```

**Cross-Chart Interaction:**
- Click element in any chart → all other charts filter to that selection
- Visual indicator shows active filters
- "Clear Filters" button returns to full dataset view
- URL updates to reflect filters (shareable links)

**Example Workflow:**
1. User clicks "California" on map
2. All charts update to show only CA aircraft
3. URL becomes: `/statistics?state=CA`
4. Manufacturer chart shows CA-specific distribution
5. User clicks "Cessna" in manufacturer chart
6. URL becomes: `/statistics?state=CA&manufacturer=Cessna`

---

### FR-8: Export & Sharing Functionality

**Export Options:**
- **Download Statistics (CSV):** Tabular data from all charts
- **Export Chart (PNG):** Individual chart as image
- **Generate Report (PDF):** Full dashboard snapshot
- **Share Link:** Copy URL with current filters applied

**Report Format (PDF):**
- Header: "Transportation Portal Statistics Report"
- Date generated
- Active filters listed
- All visualizations rendered as images
- Summary statistics table
- Footer: "© 2025 Halo Labs - Transportation Portal"
- Page size: Letter (8.5" x 11")
- Orientation: Landscape

---

### FR-9: Time Period Selector

**Control:**
```
Show data for: [All Time ▼] | [Custom Range]
```

**Options:**
- All Time (default)
- Last 5 years
- Last 10 years
- Last 20 years
- Custom: [Start Year] to [End Year]

**Impact:**
- Filters all charts to aircraft manufactured in selected period
- Does NOT filter by registration date (not available in dataset)
- Updates "Total Aircraft" metric to reflect filtered count

---

### FR-10: Comparison Mode (Phase 2 - Optional)

**Feature:**
- Select two manufacturers/states/time periods
- View side-by-side comparison across all metrics
- Highlight differences (e.g., "Cessna has 43% more aircraft than Boeing")

**UI Pattern:**
```
┌────────────────┬────────────────┐
│ Cessna         │ Boeing         │
├────────────────┼────────────────┤
│ 1,245 aircraft │ 687 aircraft   │
│ 42 models      │ 18 models      │
│ Avg age: 28yrs │ Avg age: 32yrs │
└────────────────┴────────────────┘
```

**Dimensions:**
- Each comparison panel: 500px width

---

## NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Performance
- Page load time: <2 seconds on initial load
- Chart rendering: <500ms per visualization
- Filter application: <300ms to update all charts
- Support dataset up to 50,000 records without performance degradation

### NFR-2: Data Refresh
- Statistics computed from live database queries
- No pre-aggregated cache (use Elasticsearch aggregations)
- Optional: Implement Redis cache with 5-minute TTL for expensive queries

### NFR-3: Display Requirements
- **Target Resolution:** 1920x1080 (primary), 1366x768 (minimum)
- **Minimum Screen Width:** 1280px
- **Layout:** Fixed-width centered layout (max-width: 1400px)
- Warning message displayed if viewport width < 1280px: "This application requires a minimum screen width of 1280px. Please use a desktop browser."

### NFR-4: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader labels on all charts
- Color blind friendly palettes
- High contrast mode option

### NFR-5: Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Desktop browsers only (no mobile/tablet support)

---

## TECHNICAL DESIGN

### Component Architecture

**New Route:** `/statistics`

**Component Structure:**
```
statistics/
├── pages/
│   └── statistics-page.component.ts
├── components/
│   ├── key-metrics-panel/
│   ├── geographic-map/
│   ├── manufacturer-chart/
│   ├── fleet-age-histogram/
│   ├── temporal-timeline/
│   ├── category-donut/
│   ├── technical-specs-table/
│   └── export-dialog/
└── services/
    └── statistics.service.ts
```

### API Endpoints Required

#### 1. GET /api/v1/statistics/summary
**Response:**
```json
{
  "totalAircraft": 4607,
  "activeManufacturers": 21,
  "uniqueModels": 156,
  "statesWithAircraft": 50,
  "avgAircraftAge": 28.3,
  "mostCommonCategory": "Fixed_wing_single",
  "lastUpdated": "2025-10-04T00:00:00Z"
}
```

#### 2. GET /api/v1/statistics/geographic
**Query Params:** `?year_min=YYYY&year_max=YYYY&manufacturer=XXX`

**Response:**
```json
{
  "byState": [
    {"state": "CA", "count": 892, "percentage": 19.4, "topManufacturer": "Cessna"},
    {"state": "TX", "count": 754, "percentage": 16.4, "topManufacturer": "Cessna"}
  ]
}
```

#### 3. GET /api/v1/statistics/manufacturers
**Response:**
```json
{
  "manufacturers": [
    {
      "name": "Cessna",
      "count": 1245,
      "percentage": 27.0,
      "models": [
        {"name": "172S", "count": 245},
        {"name": "182T", "count": 187}
      ]
    }
  ]
}
```

#### 4. GET /api/v1/statistics/fleet-age
**Response:**
```json
{
  "ageDistribution": [
    {"bin": "Pre-1950", "count": 145, "percentage": 3.1},
    {"bin": "1950-1969", "count": 423, "percentage": 9.2},
    {"bin": "1970-1989", "count": 1287, "percentage": 27.9}
  ],
  "yearlyProduction": [
    {"year": 1910, "count": 2},
    {"year": 1911, "count": 5}
  ]
}
```

#### 5. GET /api/v1/statistics/technical
**Response:**
```json
{
  "categories": [
    {"name": "Fixed_wing_single", "count": 3245, "percentage": 70.4}
  ],
  "engineTypes": [
    {"name": "Reciprocating", "count": 3892, "percentage": 84.5}
  ],
  "fuelTypes": [
    {"name": "Gasoline", "count": 3654, "percentage": 79.3}
  ],
  "specifications": {
    "year": {"min": 1910, "max": 2025, "avg": 1987, "median": 1994},
    "capacity": {"min": 1, "max": 350, "avg": 4.2, "median": 2}
  }
}
```

#### 6. GET /api/v1/statistics/export
**Query Params:** `?format=csv|json|pdf&filters={...}`

**Response:** File download

---

### Backend Implementation Notes

**Elasticsearch Aggregations:**
```javascript
// Example: Geographic distribution
const result = await esClient.search({
  index: 'transport-unified',
  body: {
    size: 0,
    query: { term: { transport_type: 'plane' } },
    aggs: {
      by_state: {
        terms: { field: 'state.keyword', size: 100 },
        aggs: {
          top_manufacturer: {
            terms: { field: 'manufacturer.keyword', size: 1 }
          }
        }
      }
    }
  }
});
```

**Caching Strategy:**
- Use Redis for expensive aggregations
- Key pattern: `stats:${endpoint}:${hash(filters)}`
- TTL: 5 minutes
- Invalidate on data ingestion

---

### Frontend Libraries

**Charting:**
- **Recharts** (preferred): React-native charts, good TypeScript support
- **Alternative:** Chart.js with react-chartjs-2 wrapper

**Mapping:**
- **Leaflet** with react-leaflet for interactive maps
- **Alternative:** D3.js for custom choropleth

**Data Handling:**
- **Lodash** for aggregations/transformations
- **Date-fns** for date formatting

**Export:**
- **jsPDF** for PDF generation
- **html2canvas** for chart screenshots
- **Papa Parse** for CSV export

---

### State Management Integration

**StateManagementService Extension:**
```typescript
interface StatisticsFilters {
  state?: string;
  manufacturer?: string;
  yearMin?: number;
  yearMax?: number;
  category?: string;
}

interface StatisticsState {
  filters: StatisticsFilters;
  loading: boolean;
  error: string | null;
  summary: StatisticsSummary | null;
  geographic: GeographicData | null;
  manufacturers: ManufacturerData | null;
  fleetAge: FleetAgeData | null;
  technical: TechnicalData | null;
}
```

**URL Synchronization:**
```
/statistics?state=CA&manufacturer=Cessna&year_min=2000&year_max=2025
```

---

## USER WORKFLOWS

### Workflow 1: Explore Geographic Distribution

1. User navigates to `/statistics`
2. Page loads with all visualizations showing full dataset
3. User hovers over California on map → tooltip shows: "California: 892 aircraft (19.4%)"
4. User clicks California
5. All charts update to show CA-only data:
   - Key metrics update (892 total)
   - Manufacturer chart shows CA manufacturers
   - Fleet age shows CA aircraft ages
6. URL updates: `/statistics?state=CA`
7. User shares URL with colleague
8. Colleague opens URL → sees CA-filtered view

### Workflow 2: Analyze Manufacturer Trends

1. User clicks "Cessna" in manufacturer bar chart
2. Dashboard filters to Cessna aircraft only
3. Geographic map highlights states with Cessna concentrations
4. Fleet age chart shows Cessna aircraft age distribution
5. User observes: "Most Cessna aircraft were built 1970-1989"
6. User clicks "Export Chart (PNG)" on fleet age histogram
7. PNG downloads with Cessna filter applied

### Workflow 3: Generate Executive Report

1. User applies filters: State=TX, Year Range=2000-2025
2. User clicks "Generate Report (PDF)"
3. Export dialog opens:
   ```
   Report Options:
   ☑ Include Key Metrics
   ☑ Include All Charts
   ☑ Include Data Tables
   [ ] Include Raw Data
   
   [Generate PDF]
   ```
4. User clicks "Generate PDF"
5. PDF downloads: "Transportation_Statistics_TX_2000-2025.pdf"
6. Report contains:
   - Cover page with filters
   - Key metrics summary
   - All chart images
   - Top manufacturers table
   - Footer with generation date

### Workflow 4: Compare Time Periods

1. User sets time period: "Last 5 Years" (2020-2025)
2. Dashboard shows recent aircraft only
3. User notes: "Only 387 aircraft manufactured 2020-2025"
4. User changes to "Last 20 Years" (2005-2025)
5. Dashboard updates: "1,542 aircraft manufactured 2005-2025"
6. User observes growth trends in manufacturing timeline

---

## ACCEPTANCE CRITERIA

### Dashboard Structure
- [ ] Statistics page accessible at `/statistics` route
- [ ] Page layout optimized for desktop (1920x1080)
- [ ] Warning displayed if viewport < 1280px
- [ ] All charts render without errors
- [ ] Page loads in <2 seconds
- [ ] No console errors in browser

### Key Metrics Panel
- [ ] Displays 6 summary metrics in 4-column grid
- [ ] Metrics update when filters applied
- [ ] Metrics formatted with commas (e.g., "4,607")
- [ ] Panel width: Fixed, centered layout

### Geographic Visualization
- [ ] Interactive US map displays with state boundaries
- [ ] Map dimensions: 800-1000px width, 600-700px height
- [ ] States colored by aircraft concentration
- [ ] Hover tooltip shows state name and count
- [ ] Click state filters entire dashboard
- [ ] Top states table sortable by column
- [ ] Table width: 900px

### Manufacturer Analytics
- [ ] Bar chart dimensions: 600px x 400px
- [ ] Bars display count and percentage
- [ ] Click bar filters dashboard
- [ ] Treemap dimensions: 900px x 500px (if implemented)
- [ ] Hover reveals model details

### Fleet Age Analysis
- [ ] Histogram dimensions: 700px x 400px
- [ ] Timeline dimensions: 1000px x 400px
- [ ] Interactive range selector works
- [ ] Click bin filters dashboard

### Technical Specifications
- [ ] Donut chart diameter: 400px
- [ ] Engine/fuel bar charts: 600px x 400px
- [ ] Specifications table width: 800px
- [ ] All visualizations update with filters

### Filtering & Interaction
- [ ] Click any chart element filters entire dashboard
- [ ] Active filters display in panel
- [ ] Clear button removes all filters
- [ ] URL updates with filter parameters
- [ ] Shared URLs load with correct filters

### Export Functionality
- [ ] CSV export downloads successfully
- [ ] PNG export captures charts correctly
- [ ] PDF report generates in landscape letter format
- [ ] Share link copies to clipboard

### Data Accuracy
- [ ] All counts match database queries
- [ ] Percentages sum to 100% (where applicable)
- [ ] No data loss during aggregation
- [ ] Filters produce correct subsets

### Accessibility
- [ ] All charts have ARIA labels
- [ ] Keyboard navigation functional
- [ ] Screen reader announces selections
- [ ] Color contrast meets WCAG AA

---

## OUT OF SCOPE (Future Enhancements)

1. **Mobile/Tablet Support**
   - Application explicitly designed for desktop only
   - No responsive breakpoints for smaller screens

2. **Real-time Data Streaming**
   - Live updates as new aircraft registered
   - WebSocket connection for real-time statistics

3. **Predictive Analytics**
   - Machine learning forecasts
   - Trend predictions
   - Anomaly detection algorithms

4. **Advanced Comparisons**
   - Multi-select comparison (3+ entities)
   - Statistical significance testing
   - Correlation analysis

5. **Custom Dashboard Builder**
   - Drag-and-drop chart arrangement
   - Save custom dashboard layouts
   - Share custom dashboards

6. **Data Download Limits**
   - For initial implementation, allow unlimited exports
   - Future: Implement rate limiting or premium features

7. **Historical Snapshots**
   - Compare "now" vs "6 months ago"
   - Requires time-series data collection

8. **Social Sharing**
   - Twitter/LinkedIn share buttons
   - Embedded charts for external sites

---

## DEPENDENCIES

- ✅ Elasticsearch transport-unified index (existing)
- ✅ Backend API framework (existing)
- ✅ Frontend Angular 13 application (existing)
- ✅ StateManagementService (existing)
- ⚠️ Backend statistics endpoints (TO BE IMPLEMENTED)
- ⚠️ Chart library integration (TO BE ADDED)
- ⚠️ Map library integration (TO BE ADDED)
- ⚠️ Export libraries (TO BE ADDED)

---

## ESTIMATED EFFORT

**Backend Development:** 16-20 hours
- Statistics API endpoints: 8 hours
- Elasticsearch aggregation queries: 4 hours
- Export functionality (CSV/PDF): 4 hours
- Caching implementation: 2 hours
- Testing: 2 hours

**Frontend Development:** 24-32 hours
- Statistics page layout: 4 hours
- Key metrics panel: 2 hours
- Geographic map component: 6 hours
- Manufacturer charts (bar + treemap): 6 hours
- Fleet age histogram + timeline: 6 hours
- Technical specs dashboard: 4 hours
- Filter integration: 4 hours
- Export dialog and functionality: 4 hours
- Desktop-optimized styling: 2 hours

**Testing:** 8 hours
- Unit tests for components
- Integration tests for API
- Cross-browser testing (desktop only)
- Accessibility testing
- Performance testing

**Documentation:** 4 hours
- API documentation
- Component documentation
- User guide

**Total:** 52-64 hours (6.5-8 developer days)

---

## RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Large dataset causes slow aggregations | High | Medium | Implement Elasticsearch scroll API, caching, and pagination |
| Chart library incompatibility | Medium | Low | Evaluate libraries early, have backup options |
| Map rendering performance issues | Medium | Medium | Use lightweight Leaflet, implement viewport-based rendering |
| PDF generation memory issues | Medium | Low | Generate on backend, limit report size |
| Complex filter logic bugs | High | Medium | Comprehensive unit tests, staged rollout |
| Browser compatibility issues | Low | Low | Test on all browsers early, use polyfills |

---

## PHASED ROLLOUT

**Phase 1 (MVP):** 4-5 developer days
- Key metrics panel
- Manufacturer bar chart (enhanced existing)
- Geographic table (top 10 states)
- Basic filtering
- CSV export

**Phase 2:** 2-3 developer days
- Geographic map
- Fleet age histogram
- Category donut chart
- PNG export

**Phase 3:** 1-2 developer days
- Temporal timeline
- Treemap visualization
- Technical specs table
- PDF export

---

## APPROVAL

**Client Approval Required:** YES  

**Approved By:** ________________  
**Date:** ________________  

**Developer Assignment:** ________________  
**Estimated Completion Date:** ________________

---

## NOTES

- This Statistics page will replace/enhance the existing Statistics section below search results
- Consider making histograms on search page "mini versions" that link to full Statistics page
- URL structure allows deep linking to specific analyses
- All visualizations designed for desktop viewing (1920x1080 optimal)
- Consider adding "What's New" section highlighting recent data updates
- Future integration with automobile and marine data when those are added
- Viewport width check should be implemented in root app component, not just statistics page

---

**End of REQ-2025-003**
