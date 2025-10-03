## REQUIREMENTS DOCUMENT

**Project:** Transportation Portal - Manufacturer-State Filter Picker  
**Request ID:** REQ-2025-002  
**Date:** October 3, 2025  
**Requested By:** Client (Halo Labs)  
**Prepared By:** Development Team  
**Related CR:** CR-2025-001 (Generic Transport Architecture)

---

### EXECUTIVE SUMMARY

Implement a specialized table-based picker component for filtering transportation search results by manufacturer-state combinations. The picker displays unique manufacturer-state pairs from the full dataset with linked checkbox behavior and applies selected filters to search results and histograms.

---

### BUSINESS JUSTIFICATION

**Current State:**
- Users can only filter by typing manufacturer OR state in separate text fields
- No visibility into which manufacturer-state combinations exist in the dataset
- No way to select multiple specific combinations efficiently

**User Need:**
- See all available manufacturer-state combinations with counts
- Quickly filter to specific combinations (e.g., "Show me Cessna in CA and TX, plus Boeing in WA")
- Visual feedback on data distribution before filtering

**Business Value:**
- Improves search UX and reduces trial-and-error filtering
- Increases user engagement through data exploration
- Enables complex multi-criteria filtering workflows

---

### FUNCTIONAL REQUIREMENTS

#### FR-1: Data Display

**Table Structure:**
```
┌─────────────┬───────┬───────┐
│ Manufacturer│ State │ Count │
├─────────────┼───────┼───────┤
│ ☐ Cessna   │ ☐ CA  │   76  │
│ ☐ Cessna   │ ☐ TX  │   79  │
│ ☐ Cessna   │ ☐ FL  │   55  │
│ ☐ Boeing   │ ☐ WA  │   42  │
└─────────────┴───────┴───────┘
```

- **Column 1 (Manufacturer):** Text + Checkbox
- **Column 2 (State):** Text + Checkbox  
- **Column 3 (Count):** Display-only number showing aircraft count for that combination

**Data Source:**
- Backend endpoint: `GET /api/v1/manufacturer-state-combinations`
- Query parameters: `page`, `size`, `search`
- Response includes all unique manufacturer-state pairs from full dataset

#### FR-2: Linked Checkbox Behavior

**Rule 1: Clicking Manufacturer Checkbox**
- **Action:** Check/uncheck manufacturer checkbox on ANY row with that manufacturer
- **Effect:** Toggles manufacturer checkbox on ALL rows with same manufacturer
- **Side Effect:** Also toggles state checkbox on ALL rows with same manufacturer

**Example:**
```
Initial State:
☐ Cessna  ☐ CA  (76)
☐ Cessna  ☐ TX  (79)
☐ Cessna  ☐ FL  (55)

Click Cessna checkbox on CA row:
☑ Cessna  ☑ CA  (76)  ← Clicked here
☑ Cessna  ☑ TX  (79)  ← Auto-checked
☑ Cessna  ☑ FL  (55)  ← Auto-checked
```

**Rule 2: Clicking State Checkbox**
- **Action:** Check/uncheck state checkbox on THAT SPECIFIC row only
- **Effect:** Toggles BOTH manufacturer and state checkboxes on that row
- **Side Effect:** Other rows with same manufacturer remain unchanged

**Example:**
```
Current State (after Rule 1 above):
☑ Cessna  ☑ CA  (76)
☑ Cessna  ☑ TX  (79)
☑ Cessna  ☑ FL  (55)

Click TX state checkbox:
☑ Cessna  ☑ CA  (76)
☐ Cessna  ☐ TX  (79)  ← Both unchecked
☑ Cessna  ☑ FL  (55)
```

#### FR-3: Pagination & Scrolling

**Visible Rows Dropdown:**
- Options: 5, 10, 20 rows
- Default: 5 rows
- Persists to user preferences (localStorage)

**Scrollable Table Body:**
- Only the data rows scroll
- Column headers remain fixed at top
- Fixed height based on selected row count

**Bottom Section (Always Visible):**
- Selected item chips
- Apply and Clear buttons
- Does not scroll with table body

#### FR-4: Selected Items Display (Chips)

**Chip Format:**
```
[Cessna - CA] [×]
[Cessna - FL] [×]
[Boeing - WA] [×]
```

**Chip Behavior:**
- Display format: `{Manufacturer} - {State}`
- Click `×` to deselect that specific combination
- Clicking `×` unchecks BOTH checkboxes for that row in table

**Chip Container:**
- Fixed at bottom of picker
- Scrolls horizontally if many selections
- Shows "No selections" message when empty

#### FR-5: Action Buttons

**Apply Button:**
- Emits selected combinations to parent component
- Parent component updates search filters
- Histogram 1 filters to show only selected manufacturers
- Does NOT close picker (allows iterative refinement)

**Clear Button:**
- Unchecks all checkboxes in table
- Removes all chips
- Does NOT trigger search (requires Apply after Clear)

#### FR-6: Search/Filter

**Search Input Box:**
- Placeholder: "Search manufacturer and state..."
- Filters table rows client-side (no API call)
- Searches both manufacturer and state columns
- Case-insensitive matching

#### FR-7: URL State Persistence

**URL Parameters:**
```
?mfrs=Cessna,Boeing&states=Cessna:CA,Cessna:TX,Boeing:WA
```

**Format:**
- `mfrs`: Comma-separated list of selected manufacturers
- `states`: Comma-separated list of `{manufacturer}:{state}` pairs

**Behavior:**
- Picker reads URL on initialization
- Checkboxes pre-checked based on URL params
- Chips display based on URL params
- URL updates when Apply button clicked

---

### NON-FUNCTIONAL REQUIREMENTS

#### NFR-1: Performance
- Table renders smoothly with 1000+ rows
- Checkbox state changes respond < 100ms
- Pagination change < 200ms
- Search filtering < 100ms

#### NFR-2: Responsiveness
- Component width: 100% of parent container
- Minimum width: 400px
- Mobile-friendly (horizontal scroll for chips if needed)

#### NFR-3: Accessibility
- Keyboard navigation support (Tab, Space, Enter)
- ARIA labels on checkboxes
- Screen reader announces selection changes

#### NFR-4: Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

### TECHNICAL DESIGN

#### Component Architecture

**New Component:** `manufacturer-state-table-picker`

**Location:** `src/app/shared/components/manufacturer-state-table-picker/`

**Files:**
```
manufacturer-state-table-picker/
├── manufacturer-state-table-picker.component.ts
├── manufacturer-state-table-picker.component.html
├── manufacturer-state-table-picker.component.scss
└── manufacturer-state-table-picker.component.spec.ts
```

#### Component Interface

```typescript
@Component({
  selector: 'app-manufacturer-state-table-picker',
  templateUrl: './manufacturer-state-table-picker.component.html',
  styleUrls: ['./manufacturer-state-table-picker.component.scss']
})
export class ManufacturerStateTablePickerComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<ManufacturerStateSelection[]>();
  
  // Internal state
  rows: PickerRow[] = [];
  selectedRows: Set<string> = new Set(); // Keys: "manufacturer|state"
  pageSize: number = 5;
  currentPage: number = 1;
  searchTerm: string = '';
  loading: boolean = false;
}

interface PickerRow {
  manufacturer: string;
  state: string;
  count: number;
  key: string; // "manufacturer|state" for efficient lookup
}

interface ManufacturerStateSelection {
  manufacturer: string;
  state: string;
}
```

#### State Management Strategy

**Single Source of Truth:**
```typescript
private selectedRows = new Set<string>(); // e.g., "Cessna|CA"
```

**Derived Data (Computed):**
```typescript
get selectedChips(): ManufacturerStateSelection[] {
  return Array.from(this.selectedRows).map(key => {
    const [manufacturer, state] = key.split('|');
    return { manufacturer, state };
  });
}

isRowSelected(row: PickerRow): boolean {
  return this.selectedRows.has(row.key);
}
```

#### Checkbox Logic Implementation

```typescript
onManufacturerCheckboxClick(clickedRow: PickerRow): void {
  const manufacturer = clickedRow.manufacturer;
  const isCurrentlySelected = this.isRowSelected(clickedRow);
  
  // Find all rows with this manufacturer
  const relatedRows = this.rows.filter(r => r.manufacturer === manufacturer);
  
  if (isCurrentlySelected) {
    // Uncheck all rows with this manufacturer
    relatedRows.forEach(row => this.selectedRows.delete(row.key));
  } else {
    // Check all rows with this manufacturer
    relatedRows.forEach(row => this.selectedRows.add(row.key));
  }
}

onStateCheckboxClick(clickedRow: PickerRow): void {
  // Toggle only this specific row
  if (this.selectedRows.has(clickedRow.key)) {
    this.selectedRows.delete(clickedRow.key);
  } else {
    this.selectedRows.add(clickedRow.key);
  }
}
```

---

### API CONTRACT

#### Endpoint: `GET /api/v1/manufacturer-state-combinations`

**Request:**
```http
GET /api/v1/manufacturer-state-combinations?page=1&size=20&search=cessna
```

**Response:**
```json
{
  "total": 2188,
  "page": 1,
  "size": 20,
  "items": [
    {
      "manufacturer": "Cessna",
      "state": "TX",
      "count": 79
    },
    {
      "manufacturer": "Cessna",
      "state": "CA",
      "count": 76
    }
  ]
}
```

**Status:** ✅ Already implemented in backend (verified working)

---

### USER WORKFLOWS

#### Workflow 1: Select All Aircraft from One Manufacturer

1. User opens picker
2. Clicks Cessna checkbox on any Cessna row
3. All Cessna rows auto-check (CA, TX, FL, etc.)
4. Chips appear: `[Cessna - CA] [Cessna - TX] [Cessna - FL]`
5. User clicks Apply
6. Search filters to Cessna only, all states

#### Workflow 2: Exclude Specific State

1. Following Workflow 1 (all Cessna states selected)
2. User clicks TX state checkbox
3. Only TX row unchecks (CA and FL remain checked)
4. TX chip disappears
5. User clicks Apply
6. Search shows Cessna in CA and FL only

#### Workflow 3: Multi-Manufacturer Selection

1. User clicks Cessna manufacturer checkbox → All Cessna states selected
2. User clicks Boeing manufacturer checkbox → All Boeing states selected
3. User clicks Piper TX state checkbox → Only Piper TX selected
4. Chips show: `[Cessna - CA] [Cessna - TX] ... [Boeing - WA] ... [Piper - TX]`
5. User clicks Apply
6. Histogram 1 shows only Cessna, Boeing, and Piper

#### Workflow 4: URL Sharing

1. User makes complex selection (Workflow 3)
2. Clicks Apply
3. URL updates: `?mfrs=Cessna,Boeing,Piper&states=Cessna:CA,Cessna:TX,Boeing:WA,Piper:TX`
4. User copies URL and sends to colleague
5. Colleague opens URL → Picker pre-populates with selections
6. Search automatically executes with those filters

---

### ACCEPTANCE CRITERIA

- [ ] Picker displays table with Manufacturer, State, Count columns
- [ ] Clicking manufacturer checkbox affects all rows with that manufacturer
- [ ] Clicking state checkbox affects only that specific row
- [ ] Chips display all selected combinations
- [ ] Clicking chip `×` deselects that combination
- [ ] Apply button emits selections to parent component
- [ ] Clear button removes all selections
- [ ] Pagination dropdown works (5/10/20 rows)
- [ ] Table body scrolls, headers/bottom section fixed
- [ ] Search filters table rows by manufacturer or state
- [ ] URL parameters persist selections across page refresh
- [ ] Component compiles without TypeScript errors
- [ ] No console errors in browser
- [ ] Component styling matches application theme

---

### OUT OF SCOPE (Future Enhancements)

1. **Filter Manager Component**
   - Central management of all active filters
   - Separate requirement document needed

2. **Server-Side Search Filtering**
   - Currently client-side only
   - For datasets >10,000 combinations

3. **Bulk Selection Actions**
   - "Select All", "Deselect All" buttons
   - "Select Top 10" functionality

4. **Advanced Sorting**
   - Sort by count (ascending/descending)
   - Sort by manufacturer/state alphabetically

5. **Export Selections**
   - Download selected combinations as CSV
   - Share selections via permalink

---

### DEPENDENCIES

- ✅ Backend API endpoint (already implemented)
- ✅ StateManagementService (already implemented)
- ✅ Generic TransportVehicle model (CR-2025-001)
- ✅ URL state management pattern (already implemented)

---

### ESTIMATED EFFORT

**Component Development:** 6-8 hours
- HTML template with table structure: 1 hour
- SCSS styling (fixed header/bottom, scrolling): 1 hour  
- TypeScript checkbox logic: 2-3 hours
- Chip display and removal: 1 hour
- URL persistence integration: 1-2 hours
- Search/pagination: 1 hour

**Testing:** 3 hours
- Unit tests for checkbox logic
- Integration test with aircraft-search component
- Browser compatibility testing
- Accessibility testing

**Total:** 9-11 hours

---

### RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex checkbox logic has bugs | High | Comprehensive unit tests, manual QA |
| Performance issues with large datasets | Medium | Client-side pagination, lazy rendering |
| URL state becomes too long | Low | Use compressed format if needed |
| Accessibility issues | Medium | Follow ARIA best practices from start |

---

### APPROVAL

**Client Approval Required:** YES  

**Approved By:** ________________  
**Date:** ________________  

**Developer Assignment:** ________________  
**Estimated Completion Date:** ________________

---

**Notes:**
- This picker is transport-agnostic and can be reused for automobile/marine filtering
- Consider genericizing to `{field1}-{field2}-table-picker` for other use cases
- Chip display pattern can be extracted to reusable component if used elsewhere
EOF
```

**Explanation:** Creates a comprehensive requirements document for the manufacturer-state picker component, documenting the linked checkbox behavior, technical design, workflows, and acceptance criteria based on our discussion.

**Preview:** Review this document, and once approved, we'll begin implementation of the picker component according to these specifications.
