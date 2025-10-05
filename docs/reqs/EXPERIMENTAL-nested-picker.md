# EXPERIMENTAL: Hierarchical Manufacturer-State Picker

**Branch:** experimental/nested-picker  
**Date:** 2025-10-05  
**Status:** Experimental - may or may not be merged  
**Related:** REQ-2025-002 (original flat picker)

---

## Concept

Replace flat manufacturer-state table (2,188 rows) with hierarchical nested table (~21 parent rows).

## Visual Design

### Collapsed State (Default)
```
┌──────────────────────────────────────────────────┐
│ Search manufacturer...                [10 rows ▼]│
├────┬─────────────────────────┬──────────┬────────┤
│ ☐  │ Manufacturer            │ Count    │   >    │
├────┼─────────────────────────┼──────────┼────────┤
│ ☐  │ Cessna                  │ 1,245    │   >    │
│ ☐  │ Boeing                  │ 687      │   >    │
│ ☐  │ Piper                   │ 542      │   >    │
│ ☐  │ Beechcraft              │ 423      │   >    │
└────┴─────────────────────────┴──────────┴────────┘
```

### Expanded State (Click Cessna row)
```
┌────┬─────────────────────────┬──────────┬────────┐
│ ☑  │ Cessna                  │ 1,245    │   ∨    │
│    ├─────┬───────────────────┼──────────┤        │
│    │ ☑   │ CA                │ 245      │        │
│    │ ☑   │ TX                │ 187      │        │
│    │ ☑   │ FL                │ 156      │        │
│    │ ☑   │ AK                │ 134      │        │
│    └─────┴───────────────────┴──────────┘        │
│ ☐  │ Boeing                  │ 687      │   >    │
└────┴─────────────────────────┴──────────┴────────┘
```

### Indeterminate State (One state unchecked)
```
┌────┬─────────────────────────┬──────────┬────────┐
│ ☑- │ Cessna                  │ 1,245    │   ∨    │
│    ├─────┬───────────────────┼──────────┤        │
│    │ ☑   │ CA                │ 245      │        │
│    │ ☐   │ TX                │ 187      │        │
│    │ ☑   │ FL                │ 156      │        │
│    │ ☑   │ AK                │ 134      │        │
│    └─────┴───────────────────┴──────────┘        │
└────┴─────────────────────────┴──────────┴────────┘
```

---

## Checkbox Logic

### Parent Checkbox Behavior
1. **Check parent** → Check all child states
2. **Uncheck parent** → Uncheck all child states
3. **Click indeterminate parent** → Check all child states

### Child Checkbox Behavior
1. **Check child** → Parent becomes checked or indeterminate
2. **Uncheck child** → Parent becomes indeterminate or unchecked
3. **All children checked** → Parent shows fully checked
4. **Some children checked** → Parent shows indeterminate (-)
5. **No children checked** → Parent shows unchecked

### State Calculation
```typescript
getParentCheckboxState(manufacturer: string): 'checked' | 'indeterminate' | 'unchecked' {
  const states = this.getStatesForManufacturer(manufacturer);
  const checkedCount = states.filter(s => this.isSelected(manufacturer, s)).length;
  
  if (checkedCount === 0) return 'unchecked';
  if (checkedCount === states.length) return 'checked';
  return 'indeterminate';
}
```

---

## Data Structure

### Backend Response (No Change)
Keep existing `/api/v1/manufacturer-state-combinations` endpoint.

### Frontend Transformation
```typescript
interface ManufacturerGroup {
  manufacturer: string;
  totalCount: number;
  states: StateDetail[];
  expanded: boolean;
}

interface StateDetail {
  state: string;
  count: number;
}

// Transform flat data to hierarchical
groupByManufacturer(flatData: PickerRow[]): ManufacturerGroup[] {
  const grouped = new Map<string, ManufacturerGroup>();
  
  for (const row of flatData) {
    if (!grouped.has(row.manufacturer)) {
      grouped.set(row.manufacturer, {
        manufacturer: row.manufacturer,
        totalCount: 0,
        states: [],
        expanded: false
      });
    }
    
    const group = grouped.get(row.manufacturer)!;
    group.totalCount += row.count;
    group.states.push({ state: row.state, count: row.count });
  }
  
  return Array.from(grouped.values());
}
```

---

## NG-ZORRO Implementation

### Parent Table
```html
<nz-table #manufacturerTable 
          [nzData]="manufacturerGroups" 
          [nzPageSize]="pageSize"
          [nzShowPagination]="true">
  <thead>
    <tr>
      <th nzWidth="40px"></th> <!-- Checkbox -->
      <th>Manufacturer</th>
      <th nzWidth="100px">Count</th>
      <th nzWidth="40px"></th> <!-- Expand icon -->
    </tr>
  </thead>
  <tbody>
    <ng-template ngFor let-group [ngForOf]="manufacturerTable.data">
      <!-- Parent Row -->
      <tr>
        <td>
          <label nz-checkbox 
                 [nzIndeterminate]="getParentState(group.manufacturer) === 'indeterminate'"
                 [ngModel]="getParentState(group.manufacturer) === 'checked'"
                 (ngModelChange)="onParentCheckboxChange(group.manufacturer, $event)">
          </label>
        </td>
        <td>{{ group.manufacturer }}</td>
        <td>{{ group.totalCount }}</td>
        <td [nzExpand]="group.expanded" 
            (nzExpandChange)="onExpandChange(group.manufacturer, $event)">
        </td>
      </tr>
      
      <!-- Child Table (Expanded) -->
      <tr [nzExpand]="group.expanded">
        <td colspan="4" style="padding: 0;">
          <nz-table [nzData]="group.states" 
                    [nzShowPagination]="false"
                    [nzSize]="'small'">
            <tbody>
              <tr *ngFor="let state of group.states">
                <td nzWidth="40px"></td> <!-- Indent -->
                <td nzWidth="40px">
                  <label nz-checkbox 
                         [ngModel]="isSelected(group.manufacturer, state.state)"
                         (ngModelChange)="onChildCheckboxChange(group.manufacturer, state.state, $event)">
                  </label>
                </td>
                <td>{{ state.state }}</td>
                <td nzWidth="100px">{{ state.count }}</td>
              </tr>
            </tbody>
          </nz-table>
        </td>
      </tr>
    </ng-template>
  </tbody>
</nz-table>
```

---

## Selection Storage (No Change)

Keep existing `Set<string>` with "Manufacturer|State" keys:
```typescript
selectedRows = new Set<string>(); // e.g., "Cessna|CA", "Cessna|TX"
```

This maintains compatibility with existing chip display and Apply button logic.

---

## User Workflows

### Workflow 1: Select All States for One Manufacturer
1. User sees collapsed table with Cessna showing 1,245 aircraft
2. Clicks Cessna checkbox (parent)
3. All Cessna states automatically selected (no expansion needed)
4. Chips appear: [Cessna - CA] [Cessna - TX] [Cessna - FL] ...
5. User clicks Apply
6. Search filters to all Cessna aircraft

### Workflow 2: Select Specific States
1. User clicks expand icon (>) on Cessna row
2. Row expands to show nested state table
3. User checks CA and TX state checkboxes
4. Parent checkbox shows indeterminate (-)
5. Chips show: [Cessna - CA] [Cessna - TX]
6. User clicks Apply
7. Search filters to Cessna in CA and TX only

### Workflow 3: Deselect One State
1. All Cessna states selected (parent checked)
2. User expands Cessna row
3. User unchecks TX checkbox
4. Parent changes to indeterminate (-)
5. TX chip disappears
6. User clicks Apply
7. Search shows Cessna in all states except TX

---

## Advantages Over Flat Table

**Pros:**
- Fewer rows to scroll (21 vs 2,188)
- Clearer manufacturer-level selection
- Natural grouping matches mental model
- Easier to find specific manufacturer
- Parent checkbox provides "select all" shortcut

**Cons:**
- Requires extra click to see states
- More complex checkbox logic
- Hidden information (states not visible until expanded)
- Pagination at manufacturer level only

---

## Acceptance Criteria

- [ ] Parent table shows unique manufacturers only
- [ ] Count column shows total across all states
- [ ] Clicking parent checkbox selects all states
- [ ] Clicking expand icon reveals nested state table
- [ ] Child checkboxes control individual states
- [ ] Parent checkbox shows indeterminate when appropriate
- [ ] Chips display selected manufacturer-state combinations
- [ ] Apply button emits correct selections
- [ ] Search input filters manufacturers (parent rows only)
- [ ] Pagination works on parent rows
- [ ] URL persistence still works
- [ ] No breaking changes to existing functionality

---

## Implementation Checklist

- [ ] Group flat data by manufacturer in component
- [ ] Add expand/collapse state tracking
- [ ] Implement parent checkbox state calculation
- [ ] Wire up parent checkbox click handler
- [ ] Wire up child checkbox click handlers
- [ ] Update template to use nzExpand
- [ ] Style nested table appropriately
- [ ] Test all checkbox state transitions
- [ ] Verify chip display still works
- [ ] Verify Apply button still emits correctly

---

## Rollback Plan

If nested picker doesn't work well:
1. Delete experimental branch
2. Keep flat picker on main
3. Document lessons learned

This is why it's experimental - no commitment to merge.

