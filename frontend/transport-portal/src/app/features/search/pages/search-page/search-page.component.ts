import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateManagementService } from '../../../../core/services/state-management.service';
import { SearchState, SearchFilters } from '../../../../models';
import { Subscription } from 'rxjs';

interface HistogramData {
  label: string;
  count: number;
}

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss']
})
export class SearchPageComponent implements OnInit, OnDestroy {
  // State subscriptions
  state$ = this.stateService.state$;
  private subscription?: Subscription;
  
  // Derived state for template
  state: SearchState | null = null;

  constructor(private stateService: StateManagementService) { }

  ngOnInit(): void {
    this.subscription = this.state$.subscribe(state => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // Event handlers - delegate to state service
  onSearch(filters: SearchFilters): void {
    this.stateService.updateFilters(filters);
  }

  onReset(): void {
    this.stateService.resetSearch();
  }

  onManufacturerStateSelection(selections: Array<{manufacturer: string, state: string}>): void {
    if (selections.length > 0) {
      const first = selections[0];
      this.stateService.updateFilters({
        ...this.state?.filters,
        manufacturer: first.manufacturer,
        state: first.state
      });
    }
  }

  onPageChange(page: number): void {
    this.stateService.updatePage(page);
  }

  onManufacturerBarClick(manufacturer: string): void {
    this.stateService.selectManufacturer(manufacturer);
  }

  onViewDetails(transportId: string): void {
    // TODO: Navigate to detail page
    console.log('View details for:', transportId);
  }

  // Computed properties for child components
  get currentFilters(): SearchFilters {
    return this.state?.filters || {};
  }

  get vehicles() {
    return this.state?.results || [];
  }

  get loading(): boolean {
    return this.state?.loading || false;
  }

  get error(): string | null {
    return this.state?.error || null;
  }

  get hasSearched(): boolean {
    return this.state?.hasSearched || false;
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

  get selectedManufacturer(): string | null {
    return this.state?.selectedManufacturer || null;
  }

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
}
