import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StateManagementService } from '../../core/services/state-management.service';
import { SearchState, SearchStatistics } from '../../models';
import { HistogramData } from '../histogram/histogram.component';
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

  constructor(
    private stateService: StateManagementService,
    private router: Router
  ) { }

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

  onPageChange(page: number): void {
    this.stateService.updatePage(page);
  }

  onViewDetails(transportId: string): void {
    this.router.navigate(['/aircraft', transportId]);
  }

  onManufacturerClick(manufacturer: string | null): void {
    // Select manufacturer for histogram 2
    this.stateService.selectManufacturer(manufacturer);
  }

  // Histogram data getters
  get manufacturerHistogramData(): HistogramData[] {
    if (!this.state?.statistics) return [];
    
    return Object.entries(this.state.statistics.byManufacturer).map(([label, count]) => ({
      label,
      count
    }));
  }

  get modelHistogramData(): HistogramData[] {
    if (!this.state?.statistics || !this.state.selectedManufacturer) return [];
    
    const models = this.state.statistics.modelsByManufacturer[this.state.selectedManufacturer];
    if (!models) return [];
    
    return Object.entries(models).map(([label, count]) => ({
      label,
      count
    }));
  }

  get selectedManufacturer(): string | null {
    return this.state?.selectedManufacturer || null;
  }

  // Convenience getters
  get loading(): boolean {
    return this.state?.loading || false;
  }

  get error(): string | null {
    return this.state?.error || null;
  }

  get vehicles() {
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

  get hasSearched(): boolean {
    return this.state?.hasSearched || false;
  }
}
