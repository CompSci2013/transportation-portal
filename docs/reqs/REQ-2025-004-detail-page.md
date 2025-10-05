## REQ-2025-004: Aircraft Detail Page

**Server:** Thor  
**Directory:** `~/projects/transportation/docs/reqs`

```bash
cd ~/projects/transportation/docs/reqs && \
cat > REQ-2025-004.md << 'EOF'
# REQUIREMENTS DOCUMENT

**Project:** Transportation Portal - Aircraft Detail Page  
**Request ID:** REQ-2025-004  
**Date:** 2025-10-05  
**Requested By:** Client (Halo Labs)  
**Prepared By:** Development Team  
**Related:** CR-2025-001 (Generic Transport Architecture), CR-2025-002 (Table Integration)

---

## EXECUTIVE SUMMARY

Implement a dedicated detail page for viewing comprehensive information about a single aircraft. The page displays all available data fields, owner information, technical specifications, and registration history when a user clicks "View Details" from the search results table.

---

## BUSINESS JUSTIFICATION

**Current State:**
- "View Details" button in results table does nothing
- Users cannot view full aircraft information
- No way to deep-link to specific aircraft
- Missing key user journey endpoint

**User Need:**
- View complete aircraft details without clutter of search results
- Access all data fields (many hidden in results table)
- Share direct links to specific aircraft
- Print or export individual aircraft records

**Business Value:**
- Completes core search → detail user flow
- Enables aircraft registry lookups
- Supports research and verification use cases
- Foundation for future features (history tracking, favorites, comparisons)

---

## FUNCTIONAL REQUIREMENTS

### FR-1: Page Structure & Routing

**Route:** `/search/aircraft/:id`

**Example:** `http://transportation.minilab/search/aircraft/plane-N12345`

**Route Parameters:**
- `id`: Full transport_id from database (e.g., "plane-N12345")
- Must handle URL encoding for special characters

**Navigation Sources:**
1. Click "View Details" in results table
2. Direct URL entry/bookmark
3. Shared links
4. Future: Search suggestions, related aircraft

**Breadcrumb:**
```
Home > Search Aircraft > N12345
```

---

### FR-2: Data Display Sections

**Page Layout:**

```
┌────────────────────────────────────────────────────┐
│ Header: N12345 - Cessna 172S                       │
├────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────────────┐   │
│ │ Basic Info      │  │ Registration            │   │
│ │ - Manufacturer  │  │ - ID                    │   │
│ │ - Model         │  │ - Country               │   │
│ │ - Year          │  │ - Status                │   │
│ │ - Category      │  │                         │   │
│ └─────────────────┘  └─────────────────────────┘   │
│                                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Location                                        ││
│ │ - City, State, Country                          ││
│ └─────────────────────────────────────────────────┘│
│                                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Owner Information                               ││
│ │ - Type (Individual/LLC/Corporation)             ││
│ │ - Name                                          ││
│ │ - Country                                       ││
│ └─────────────────────────────────────────────────┘│
│                                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Technical Specifications                        ││
│ │ - Engine Type                                   ││
│ │ - Fuel Type                                     ││
│ │ - Capacity                                      ││
│ │ - Power                                         ││
│ └─────────────────────────────────────────────────┘│
│                                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Aircraft-Specific Data (plane_data)             ││
│ │ - Serial Number                                 ││
│ │ - Engine Count/Manufacturer/Model               ││
│ │ - Airworthiness Class/Date                      ││
│ │ - Mode S Code                                   ││
│ └─────────────────────────────────────────────────┘│
│                                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Metadata                                        ││
│ │ - Source (FAA)                                  ││
│ │ - Ingest Date                                   ││
│ │ - Last Updated                                  ││
│ └─────────────────────────────────────────────────┘│
│                                                    │
│ [Back to Search] [Export] [Share Link]             │
└────────────────────────────────────────────────────┘
```

---

### FR-3: Data Field Display Rules

**Always Show:**
- Registration ID (prominently in header)
- Manufacturer
- Model
- Year
- Category (Aircraft Type)
- State/Country

**Show if Available:**
- City (location)
- Owner information (type, name)
- Engine details
- Serial number
- All plane_data fields

**Handle Nulls:**
- Display "Not Available" or "-" for missing fields
- Don't hide sections, show empty state
- Use consistent null display pattern

**Field Labels:**
- Use friendly names: "Registration ID" not "registration_id"
- Consistent capitalization
- Tooltips for technical terms (e.g., "Mode S Code")

---

### FR-4: Actions & Interactions

**Back to Search:**
- Button returns to last search state (uses browser history)
- Preserves search filters/pagination in URL

**Export:**
- Download aircraft details as JSON
- Optional: Print-friendly view (future)

**Share Link:**
- Copy current URL to clipboard
- Shows confirmation toast: "Link copied!"

**Related Aircraft (Phase 2 - Future):**
- Show other aircraft from same manufacturer
- Show other aircraft in same state
- Show aircraft with similar specs

---

### FR-5: Error Handling

**Aircraft Not Found:**
```
┌─────────────────────────────────────┐
│  Aircraft Not Found                 │
│                                     │
│  The aircraft N12345 could not be   │
│  found in the registry.             │
│                                     │
│  [Back to Search]                   │
└─────────────────────────────────────┘
```

**Invalid ID Format:**
- Redirect to search page with error message
- Log warning for debugging

**API Error:**
- Show error message with retry option
- Log error details
- Graceful degradation

---

## NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Performance
- Page load: <1 second for cached data
- API call: <500ms for single aircraft lookup
- Image loading: Lazy load if images added (future)

### NFR-2: SEO & Sharing
- Page title: "N12345 - Cessna 172S | Aircraft Registry"
- Meta description: "View details for [Registration] - [Manufacturer] [Model]"
- Open Graph tags for social sharing (future)

### NFR-3: Responsiveness
- Desktop optimized (1920x1080)
- Minimum width: 1280px
- Mobile view: Future enhancement

### NFR-4: Accessibility
- Semantic HTML structure
- Proper heading hierarchy (h1, h2, h3)
- Screen reader labels
- Keyboard navigation
- WCAG 2.1 AA compliance

### NFR-5: Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## TECHNICAL DESIGN

### Component Architecture

**New Component:** `aircraft-detail-page`

**Location:** `src/app/features/search/pages/aircraft-detail/`

**File Structure:**
```
aircraft-detail/
├── aircraft-detail.component.ts
├── aircraft-detail.component.html
├── aircraft-detail.component.scss
└── aircraft-detail.component.spec.ts
```

**Routing Configuration:**

```typescript
// app-routing.module.ts
{
  path: 'search',
  children: [
    { path: '', component: SearchPageComponent },
    { path: 'aircraft/:id', component: AircraftDetailComponent }
  ]
}
```

---

### API Endpoint

**Endpoint:** `GET /api/v1/aircraft/:id`

**Example:** `GET /api/v1/aircraft/plane-N12345`

**Response:**
```json
{
  "id": "plane-N12345",
  "transport_id": "plane-N12345",
  "transport_type": "plane",
  "category": "fixed_wing_single",
  "manufacturer": "Cessna",
  "manufacturer_country": "US",
  "model": "172S",
  "model_variant": null,
  "year": 2006,
  "registration_id": "N12345",
  "registration_country": "US",
  "registration_status": "active",
  "location": {
    "city": "SAN DIEGO",
    "state_province": "CA",
    "country": "US",
    "coordinates": null
  },
  "dates": {
    "manufactured": "2006-01-01",
    "registered": null,
    "last_activity": null,
    "expires": null
  },
  "owner": {
    "type": "individual",
    "name": "SMITH JOHN",
    "country": "US"
  },
  "specifications": {
    "engine_type": "reciprocating",
    "fuel_type": "gasoline",
    "capacity": 4,
    "power": {
      "value": 180,
      "unit": "hp"
    }
  },
  "metadata": {
    "source": "faa",
    "source_id": "N12345",
    "ingest_date": "2025-10-02T04:17:32.093064",
    "last_updated": null
  },
  "plane_data": {
    "n_number": "N12345",
    "serial_number": "172S12345",
    "aircraft_type": "fixed_wing_single",
    "engine_count": 1,
    "engine_manufacturer": "LYCOMING",
    "engine_model": "IO-360-L2A",
    "airworthiness_class": "standard",
    "airworthiness_date": null,
    "mode_s_code": null,
    "mode_s_code_hex": null,
    "fractional_ownership": false
  }
}
```

**Error Responses:**
- `404`: Aircraft not found
- `400`: Invalid ID format
- `500`: Server error

---

### Component Implementation

**aircraft-detail.component.ts:**

```typescript
export class AircraftDetailComponent implements OnInit, OnDestroy {
  aircraft: TransportVehicle | null = null;
  loading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private clipboard: Clipboard,
    private message: NzMessageService
  ) {}
  
  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          const id = params['id'];
          return this.apiService.getAircraftById(id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (aircraft) => {
          this.aircraft = aircraft;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.status === 404 
            ? 'Aircraft not found' 
            : 'Failed to load aircraft details';
          this.loading = false;
        }
      });
  }
  
  goBack(): void {
    // Uses browser history to return to previous search state
    window.history.back();
  }
  
  exportJson(): void {
    const dataStr = JSON.stringify(this.aircraft, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.aircraft?.registration_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  shareLink(): void {
    this.clipboard.copy(window.location.href);
    this.message.success('Link copied to clipboard!');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### Backend Implementation

**New Endpoint:** `backend/src/routes/aircraft.routes.js`

```javascript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id.startsWith('plane-')) {
      return res.status(400).json({ error: 'Invalid aircraft ID format' });
    }
    
    const result = await esClient.get({
      index: process.env.ELASTICSEARCH_INDEX,
      id: id
    });
    
    if (!result.found) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    
    res.json(result._source);
    
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

### State Management Integration

**No state service changes required** - detail page is stateless, reads from URL only.

**URL Pattern:**
```
/search/aircraft/plane-N12345
```

**Navigation from results table:**

```typescript
// results-table.component.ts
onViewDetails(aircraft: TransportVehicle): void {
  this.router.navigate(['/search/aircraft', aircraft.id]);
}
```

---

## USER WORKFLOWS

### Workflow 1: View Details from Search Results

1. User performs search (e.g., manufacturer="Cessna", state="CA")
2. Results table displays 20 matching aircraft
3. User clicks "View Details" on first row (N12345)
4. Browser navigates to `/search/aircraft/plane-N12345`
5. Detail page loads aircraft data via API
6. User reviews all fields, owner info, specs
7. User clicks "Back to Search"
8. Returns to search results with filters preserved

### Workflow 2: Direct Link Access

1. User receives link: `http://transportation.minilab/search/aircraft/plane-N12345`
2. Opens link in browser
3. Detail page loads
4. User views aircraft information
5. Clicks "Back to Search" → goes to blank search page (no prior history)

### Workflow 3: Share Aircraft Details

1. User on detail page for N12345
2. Clicks "Share Link" button
3. URL copied to clipboard
4. Toast message confirms: "Link copied!"
5. User pastes link in email/chat
6. Recipient opens link → sees same detail page

### Workflow 4: Export Aircraft Data

1. User on detail page
2. Clicks "Export" button
3. Browser downloads `N12345.json` file
4. File contains complete aircraft record in JSON format
5. User can save for records or import into other tools

### Workflow 5: Aircraft Not Found

1. User navigates to `/search/aircraft/plane-INVALID`
2. API returns 404
3. Page displays "Aircraft Not Found" message
4. User clicks "Back to Search"
5. Returns to search page

---

## ACCEPTANCE CRITERIA

### Page Structure
- [ ] Route `/search/aircraft/:id` accessible
- [ ] Page renders with proper layout and sections
- [ ] All data sections visible (even if empty)
- [ ] Breadcrumb navigation displays correctly
- [ ] Page title updates with aircraft registration

### Data Display
- [ ] All basic info fields display (manufacturer, model, year, etc.)
- [ ] Owner information displays when available
- [ ] Technical specs display formatted correctly
- [ ] Plane-specific data displays
- [ ] Null/missing fields show "Not Available" consistently
- [ ] Power displays with unit (e.g., "180 hp")
- [ ] Dates format consistently (e.g., "October 2, 2025")

### Navigation & Actions
- [ ] "View Details" button in results table navigates correctly
- [ ] "Back to Search" returns to previous page (history.back)
- [ ] "Share Link" copies URL to clipboard
- [ ] Toast confirms link copied
- [ ] "Export" downloads JSON file with correct filename

### Error Handling
- [ ] 404 shows "Aircraft Not Found" message
- [ ] Invalid ID format handled gracefully
- [ ] API errors display user-friendly message
- [ ] Retry option available on error
- [ ] Loading state displays while fetching

### Performance
- [ ] Page loads in <1 second
- [ ] API call completes in <500ms
- [ ] No console errors
- [ ] Smooth transitions/animations

### Accessibility
- [ ] Proper heading hierarchy (h1 for page title)
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader labels present
- [ ] Focus management correct
- [ ] WCAG 2.1 AA compliant1

---

## OUT OF SCOPE (Future Enhancements)

1. **Related Aircraft**
   - "More from this manufacturer" section
   - "Other aircraft in this state" section

2. **History Timeline**
   - Previous registrations
   - Ownership changes
   - Location history

3. **Images & Media**
   - Aircraft photos
   - Type certificate images
   - Manufacturer logos

4. **User Interactions**
   - Save to favorites
   - Add notes/tags
   - Compare with other aircraft
   - Flag for review

5. **Social Features**
   - Share to Twitter/Facebook
   - Embed code for websites
   - QR code for mobile sharing

6. **Advanced Export**
   - PDF format
   - CSV format
   - Print-optimized view

7. **Mobile Optimization**
   - Responsive layout for phones/tablets
   - Touch-optimized controls

---

## DEPENDENCIES

- ✅ Angular 13 application (existing)
- ✅ Elasticsearch transport-unified index (existing)
- ✅ Backend API framework (existing)
- ✅ TransportVehicle model (existing)
- ✅ ApiService (existing)
- ✅ Router module (existing)
- ⚠️ Backend GET endpoint `/api/v1/aircraft/:id` (TO BE IMPLEMENTED)
- ⚠️ Detail page component (TO BE IMPLEMENTED)
- ⚠️ Clipboard API integration (TO BE ADDED)

---

## ESTIMATED EFFORT

**Backend Development:** 1 hour
- GET endpoint implementation: 30 minutes
- Error handling: 15 minutes
- Testing: 15 minutes

**Frontend Development:** 3-4 hours
- Component structure: 30 minutes
- Template layout: 1 hour
- Data binding and formatting: 1 hour
- Actions (back, export, share): 30 minutes
- Error states and loading: 30 minutes
- Styling and polish: 30 minutes

**Testing:** 1 hour
- Unit tests for component
- Integration test navigation flow
- Error scenario testing
- Cross-browser testing

**Documentation:** 30 minutes
- Component usage docs
- API endpoint docs

**Total:** 5.5-6.5 hours (less than 1 developer day)

---

## RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Large plane_data object makes page cluttered | Medium | Medium | Group into collapsible sections, prioritize important fields |
| Missing data makes page look empty | Low | High | Show "Not Available" consistently, maintain section structure |
| Back button doesn't preserve search state | Medium | Low | Use history.back() which preserves state naturally |
| API response slow for single lookups | Low | Low | Elasticsearch GET by ID is very fast (<50ms) |

---

## APPROVAL

**Client Approval Required:** YES  

**Approved By:** ________________  
**Date:** ________________  

**Developer Assignment:** ________________  
**Estimated Completion Date:** ________________

---

## NOTES

- This detail page is transport-agnostic and can be reused for automobiles/marine vessels
- Consider generic route: `/transport/:type/:id` for future multi-transport support
- Export format (JSON) chosen for developer-friendly format; add PDF/CSV later if needed
- "Back to Search" uses history.back() to preserve search state without complex state management
- Future: Add breadcrumb component for better navigation

---

**End of REQ-2025-004**
EOF
cat REQ-2025-004.md
```

**Explanation:**  
Creates comprehensive requirements document for aircraft detail page covering all aspects: UI layout, data display, navigation, error handling, technical implementation, and user workflows. Estimated at 5.5-6.5 hours of work.

**Preview:**  
After reviewing this document, shall we also create a brief **REQ-2025-005: Home Page** to address the landing page with links to different transport types?1G
