import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
  styleUrls: ['./search-page.component.scss'],
})
export class SearchPageComponent implements OnInit, OnDestroy {
  @ViewChild('resultsSection', { read: ElementRef })
  resultsSection?: ElementRef;

  state$ = this.stateService.state$;
  private subscription?: Subscription;

  state: SearchState | null = null;
  pickerClearTrigger: number = 0;

  constructor(private stateService: StateManagementService) {}

  ngOnInit(): void {
    this.subscription = this.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSearch(filters: SearchFilters): void {
    filters.manufacturerStateCombos = undefined;
    this.stateService.updateFilters(filters);
    this.pickerClearTrigger++;
  }

  onReset(): void {
    this.stateService.resetSearch();
    this.pickerClearTrigger++;
  }

  onManufacturerStateSelection(
    selections: Array<{ manufacturer: string; state: string }>
  ): void {
    this.stateService.updateFilters({
      ...this.state?.filters,
      manufacturerStateCombos: selections.length > 0 ? selections : undefined,
      manufacturer: undefined,
      state: undefined,
    });
  }

  onPageChange(page: number): void {
    this.stateService.updatePage(page);
  }

  onSortChange(event: { field: string; order: 'asc' | 'desc' }): void {
    this.stateService.updateSort(event.field, event.order);
  }

  onFilterChange(event: {
    field: string;
    value: string | number | null;
  }): void {
    const currentFilters = this.state?.filters || {};
    const updates: Partial<SearchFilters> = {};

    // Map field names to filter properties
    switch (event.field) {
      case 'registration':
        updates.filterRegistration = (event.value as string) || undefined;
        break;
      case 'manufacturer':
        updates.filterManufacturer = (event.value as string) || undefined;
        break;
      case 'model':
        updates.filterModel = (event.value as string) || undefined;
        break;
      case 'yearMin':
        updates.filterYearMin = (event.value as number) || undefined;
        break;
      case 'yearMax':
        updates.filterYearMax = (event.value as number) || undefined;
        break;
      case 'category':
        updates.filterCategory = (event.value as string) || undefined;
        break;
      case 'state':
        updates.filterState = (event.value as string) || undefined;
        break;
    }

    this.stateService.updateFilters({
      ...currentFilters,
      ...updates,
      page: 1, // Reset to page 1 when filtering
    });
  }

  onManufacturerBarClick(manufacturer: string): void {
    this.stateService.selectManufacturer(manufacturer);
  }

  onViewDetails(transportId: string): void {
    console.log('View details for:', transportId);
  }

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

    return Object.entries(this.state.statistics.byManufacturer).map(
      ([label, count]) => ({
        label,
        count,
      })
    );
  }

  get modelsHistogramData(): HistogramData[] {
    if (!this.state?.statistics?.modelsByManufacturer) return [];

    const selectedMfr = this.state.selectedManufacturer;
    const data: HistogramData[] = [];

    Object.entries(this.state.statistics.modelsByManufacturer).forEach(
      ([manufacturer, models]) => {
        if (selectedMfr && manufacturer !== selectedMfr) return;

        Object.entries(models).forEach(([model, count]) => {
          data.push({
            label: `${manufacturer} ${model}`,
            count: count as number,
          });
        });
      }
    );

    return data;
  }
}
