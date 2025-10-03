import { Component, OnInit, Output, EventEmitter, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Subscription } from 'rxjs';

interface PickerRow {
  manufacturer: string;
  state: string;
  count: number;
  key: string;
}

interface ManufacturerStateSelection {
  manufacturer: string;
  state: string;
}

@Component({
  selector: 'app-manufacturer-state-table-picker',
  templateUrl: './manufacturer-state-table-picker.component.html',
  styleUrls: ['./manufacturer-state-table-picker.component.scss']
})
export class ManufacturerStateTablePickerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() clearTrigger: number = 0;
  @Input() initialSelections: ManufacturerStateSelection[] = []; // NEW: hydrate from parent
  @Output() selectionChange = new EventEmitter<ManufacturerStateSelection[]>();

  rows: PickerRow[] = [];
  allRows: PickerRow[] = [];
  selectedRows = new Set<string>();
  
  currentPage: number = 1;
  pageSize: number = 20;
  visibleRowOptions = [5, 10, 20, 50];
  searchTerm: string = '';
  loading: boolean = false;
  
  private subscription?: Subscription;
  private lastClearTrigger: number = 0;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadData();
    this.loadPageSizePreference();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle clearTrigger
    if (changes['clearTrigger'] && !changes['clearTrigger'].firstChange) {
      const newValue = changes['clearTrigger'].currentValue;
      if (newValue !== this.lastClearTrigger) {
        this.lastClearTrigger = newValue;
        this.selectedRows.clear();
      }
    }

    // Handle initialSelections (for browser back/forward, deep links)
    if (changes['initialSelections']) {
      this.hydrateSelections();
    }
  }

  private hydrateSelections(): void {
    this.selectedRows.clear();
    
    if (this.initialSelections && this.initialSelections.length > 0) {
      this.initialSelections.forEach(selection => {
        const key = `${selection.manufacturer}|${selection.state}`;
        this.selectedRows.add(key);
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    
    this.subscription = this.apiService.getManufacturerStateCombinations(1, 10000, '').subscribe({
      next: (response) => {
        this.allRows = response.items.map((item: any) => ({
          manufacturer: item.manufacturer,
          state: item.state,
          count: item.count,
          key: `${item.manufacturer}|${item.state}`
        }));
        
        this.allRows.sort((a, b) => {
          const mfrCompare = a.manufacturer.localeCompare(b.manufacturer);
          if (mfrCompare !== 0) return mfrCompare;
          return a.state.localeCompare(b.state);
        });
        
        this.applyFilter();
        this.loading = false;
        
        // After data loads, hydrate selections from initialSelections
        this.hydrateSelections();
      },
      error: (error) => {
        console.error('Failed to load combinations:', error);
        this.loading = false;
      }
    });
  }

  onManufacturerCheckboxClick(clickedRow: PickerRow): void {
    const manufacturer = clickedRow.manufacturer;
    const isCurrentlySelected = this.isRowSelected(clickedRow);
    const relatedRows = this.allRows.filter(r => r.manufacturer === manufacturer);
    
    if (isCurrentlySelected) {
      relatedRows.forEach(row => this.selectedRows.delete(row.key));
    } else {
      relatedRows.forEach(row => this.selectedRows.add(row.key));
    }
  }

  onStateCheckboxClick(clickedRow: PickerRow): void {
    if (this.selectedRows.has(clickedRow.key)) {
      this.selectedRows.delete(clickedRow.key);
    } else {
      this.selectedRows.add(clickedRow.key);
    }
  }

  isRowSelected(row: PickerRow): boolean {
    return this.selectedRows.has(row.key);
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.rows = this.allRows;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.rows = this.allRows.filter(row => 
        row.manufacturer.toLowerCase().includes(term) ||
        row.state.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.savePageSizePreference();
  }

  get visibleRows(): PickerRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.rows.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.rows.length / this.pageSize);
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);
      
      if (start > 1) pages.push(1);
      if (start > 2) pages.push(-1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < this.totalPages - 1) pages.push(-1);
      if (end < this.totalPages) pages.push(this.totalPages);
    }
    
    return pages;
  }

  get selectedChips(): ManufacturerStateSelection[] {
    return Array.from(this.selectedRows).map(key => {
      const [manufacturer, state] = key.split('|');
      return { manufacturer, state };
    }).sort((a, b) => {
      const mfrCompare = a.manufacturer.localeCompare(b.manufacturer);
      if (mfrCompare !== 0) return mfrCompare;
      return a.state.localeCompare(b.state);
    });
  }

  removeChip(chip: ManufacturerStateSelection): void {
    const key = `${chip.manufacturer}|${chip.state}`;
    this.selectedRows.delete(key);
  }

  onApply(): void {
    this.selectionChange.emit(this.selectedChips);
  }

  onClear(): void {
    this.selectedRows.clear();
    this.onApply();
  }

  private loadPageSizePreference(): void {
    const saved = localStorage.getItem('manufacturerStatePickerPageSize');
    if (saved) {
      const size = parseInt(saved, 10);
      if (this.visibleRowOptions.includes(size)) {
        this.pageSize = size;
      }
    }
  }

  private savePageSizePreference(): void {
    localStorage.setItem('manufacturerStatePickerPageSize', this.pageSize.toString());
  }
}
