import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Injector,
} from '@angular/core';
import { PopOutManagerService, PopOutOrchestrator, PopOutMessageType } from '@halolabs/ngx-popout';
import { StateManagementService } from '../../../../core/services/state-management.service';
import { SearchState, SearchFilters } from '../../../../models';
import { ResultsTableComponent } from '../../components/results-table/results-table.component';
import { HistogramComponent } from '../../../../shared/components/histogram/histogram.component';
import { Subscription } from 'rxjs';

interface HistogramData {
  label: string;
  count: number;
}

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  providers: [PopOutManagerService, PopOutOrchestrator],
})
export class SearchPageComponent implements OnInit, OnDestroy {
  @ViewChild('resultsSection', { read: ElementRef })
  resultsSection?: ElementRef;

  state$ = this.stateService.state$;
  private subscription?: Subscription;

  state: SearchState | null = null;
  pickerClearTrigger: number = 0;

  constructor(
    private stateService: StateManagementService,
    public popouts: PopOutOrchestrator,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    // Register popout-able components
    this.popouts.register('results', ResultsTableComponent, { width: 1400, height: 800 });
    this.popouts.register('manufacturer-chart', HistogramComponent, { width: 800, height: 600 });
    this.popouts.initialize(this.injector);

    // Handle events from popped-out components
    this.popouts.messages$.subscribe(({ popoutId, message }) => {
      if (message.type !== PopOutMessageType.COMPONENT_OUTPUT) return;
      const { outputName, data } = message.payload;

      if (popoutId === 'results') {
        switch (outputName) {
          case 'pageChange': this.onPageChange(data); break;
          case 'pageSizeChange': this.onPageSizeChange(data); break;
          case 'sortChange': this.onSortChange(data); break;
          case 'filterChange': this.onFilterChange(data); break;
          case 'viewDetails': this.onViewDetails(data); break;
        }
      }

      if (popoutId === 'manufacturer-chart' && outputName === 'barClick') {
        this.onManufacturerBarClick(data);
      }
    });

    // Subscribe to state and sync popouts when data changes
    this.subscription = this.state$.subscribe((state) => {
      this.state = state;

      // Keep popouts in sync with latest data
      if (this.popouts.isOpen('results')) {
        this.popouts.syncInputs('results', {
          vehicles: state.results,
          loading: state.loading,
          totalRecords: state.totalResults,
          currentPage: state.filters.page || 1,
          pageSize: state.filters.size || 20,
        });
      }
      if (this.popouts.isOpen('manufacturer-chart')) {
        this.popouts.syncInputs('manufacturer-chart', {
          data: this.manufacturerHistogramData,
          selectedLabel: state.selectedManufacturer || null,
        });
      }
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

  onPageSizeChange(size: number): void {
    this.stateService.updateFilters({
      ...this.state?.filters,
      size: size,
      page: 1, // Reset to page 1 when changing page size
    });
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

  toggleManufacturerChartPopout(): void {
    this.popouts.toggle('manufacturer-chart', {
      title: 'Aircraft by Manufacturer',
      data: this.manufacturerHistogramData,
      clickable: true,
      selectedLabel: this.selectedManufacturer,
      maxHeight: '100%',
    });
  }

  toggleResultsPopout(): void {
    this.popouts.toggle('results', {
      vehicles: this.vehicles,
      loading: this.loading,
      totalRecords: this.totalRecords,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      filterRegistration: this.currentFilters.filterRegistration || '',
      filterManufacturer: this.currentFilters.filterManufacturer || '',
      filterModel: this.currentFilters.filterModel || '',
      filterYearMin: this.currentFilters.filterYearMin || null,
      filterYearMax: this.currentFilters.filterYearMax || null,
      filterCategory: this.currentFilters.filterCategory || '',
      filterState: this.currentFilters.filterState || '',
      title: 'Aircraft Search Results',
    });
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
