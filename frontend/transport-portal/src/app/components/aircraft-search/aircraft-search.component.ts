import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StateManagementService } from '../../core/services/state-management.service';
import { SearchState } from '../../models';
import { Subscription } from 'rxjs';

interface HistogramData {
  label: string;
  count: number;
}

@Component({
  selector: 'app-aircraft-search',
  templateUrl: './aircraft-search.component.html',
  styleUrls: ['./aircraft-search.component.scss']
})
export class AircraftSearchComponent implements OnInit, OnDestroy {
  state: SearchState | null = null;
  private stateSubscription?: Subscription;
  
  // Form fields
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
    this.stateSubscription = this.stateService.state$.subscribe(state => {
      this.state = state;
      
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

  onManufacturerStateSelection(selections: Array<{manufacturer: string, state: string}>): void {
    if (selections.length > 0) {
      const first = selections[0];
      this.manufacturer = first.manufacturer;
      this.state_province = first.state;
      this.searchAircraft();
    }
  }

  searchAircraft(): void {
    this.stateService.updateFilters({
      manufacturer: this.manufacturer.trim() || undefined,
      model: this.model.trim() || undefined,
      yearMin: this.yearMin || undefined,
      yearMax: this.yearMax || undefined,
      state: this.state_province.trim() || undefined
    });
  }

  resetFilters(): void {
    this.manufacturer = '';
    this.model = '';
    this.yearMin = null;
    this.yearMax = null;
    this.state_province = '';
    this.stateService.resetSearch();
  }

  onPageChange(page: number): void {
    this.stateService.updatePage(page);
  }

  onManufacturerBarClick(manufacturer: string): void {
    // Only update the selected manufacturer for histogram filtering
    // Does NOT change the search form or trigger a new search
    this.stateService.selectManufacturer(manufacturer);
  }

  // Histogram data transformations
  get manufacturerHistogramData(): HistogramData[] {
    if (!this.state?.statistics?.byManufacturer) return [];
    
    return Object.entries(this.state.statistics.byManufacturer).map(([label, count]) => ({
      label,
      count
    }));
  }

  get modelsHistogramData(): HistogramData[] {
    if (!this.state?.statistics?.modelsByManufacturer) return [];
    
    const selectedMfr = this.state.selectedManufacturer;
    const data: HistogramData[] = [];
    
    Object.entries(this.state.statistics.modelsByManufacturer).forEach(([manufacturer, models]) => {
      // Filter to only show selected manufacturer's models if one is selected
      if (selectedMfr && manufacturer !== selectedMfr) return;
      
      Object.entries(models).forEach(([model, count]) => {
        data.push({
          label: `${manufacturer} ${model}`,
          count: count as number
        });
      });
    });
    
    return data;
  }

  get selectedManufacturer(): string | null {
    return this.state?.selectedManufacturer || null;
  }

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
