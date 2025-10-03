import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateManagementService } from '../../core/services/state-management.service';
import { SearchState } from '../../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-aircraft-search',
  templateUrl: './aircraft-search.component.html',
  styleUrls: ['./aircraft-search.component.scss']
})
export class AircraftSearchComponent implements OnInit, OnDestroy {
  // Subscribe to state changes
  state: SearchState | null = null;
  private stateSubscription?: Subscription;
  
  // Form fields (bound to template)
  manufacturer = '';
  model = '';
  yearMin: number | null = null;
  yearMax: number | null = null;
  state_province = '';

  constructor(private stateService: StateManagementService) { }

  ngOnInit(): void {
    // Subscribe to state changes
    this.stateSubscription = this.stateService.state$.subscribe(state => {
      this.state = state;
      
      // Sync form fields with state filters
      if (state) {
        this.manufacturer = state.filters.manufacturer || '';
        this.model = state.filters.model || '';
        this.yearMin = state.filters.yearMin || null;
        this.yearMax = state.filters.yearMax || null;
        this.state_province = state.filters.state || '';
      }
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  searchAircraft(): void {
    // Update filters in state service (triggers search automatically)
    this.stateService.updateFilters({
      manufacturer: this.manufacturer.trim() || undefined,
      model: this.model.trim() || undefined,
      yearMin: this.yearMin || undefined,
      yearMax: this.yearMax || undefined,
      state: this.state_province.trim() || undefined
    });
  }

  resetFilters(): void {
    // Clear all form fields
    this.manufacturer = '';
    this.model = '';
    this.yearMin = null;
    this.yearMax = null;
    this.state_province = '';
    
    // Reset search state (clears filters and results)
    this.stateService.resetSearch();
  }

  nextPage(): void {
    if (this.state && this.hasNextPage) {
      const currentPage = this.state.filters.page || 1;
      this.stateService.updatePage(currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.state && this.hasPreviousPage) {
      const currentPage = this.state.filters.page || 1;
      this.stateService.updatePage(currentPage - 1);
    }
  }

  get loading(): boolean {
    return this.state?.loading || false;
  }

  get error(): string | null {
    return this.state?.error || null;
  }

  get aircraft() {
    return this.state?.results || [];
  }

  get totalRecords(): number {
    return this.state?.totalResults || 0;
  }

  get currentPage(): number {
    return this.state?.filters.page || 1;
  }

  get pageSize(): number {
    return this.state?.filters.size || 20;
  }

  get hasNextPage(): boolean {
    if (!this.state) return false;
    return this.currentPage * this.pageSize < this.totalRecords;
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get displayedRange(): string {
    if (!this.state || this.totalRecords === 0) return '0-0 of 0';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalRecords);
    return `${start}-${end} of ${this.totalRecords}`;
  }
}
