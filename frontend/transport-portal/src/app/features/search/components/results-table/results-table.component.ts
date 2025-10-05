import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TransportVehicle } from '../../../../models';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss'],
})
export class ResultsTableComponent {
  @Input() vehicles: TransportVehicle[] = [];
  @Input() loading: boolean = false;
  @Input() totalRecords: number = 0;

  // Filter inputs from parent
  @Input() filterRegistration: string = '';
  @Input() filterManufacturer: string = '';
  @Input() filterModel: string = '';
  @Input() filterYearMin: number | null = null;
  @Input() filterYearMax: number | null = null;
  @Input() filterCategory: string = '';
  @Input() filterState: string = '';

  @Output() viewDetails = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{
    field: string;
    order: 'asc' | 'desc';
  }>();
  @Output() filterChange = new EventEmitter<{
    field: string;
    value: string | number | null;
  }>();

  private currentSortField: string = '';
  private currentSortOrder: 'asc' | 'desc' = 'asc';
  private filterSubject = new Subject<{ field: string; value: string }>();

  constructor() {
    // Debounce filter changes to avoid excessive API calls
    this.filterSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(
          (a, b) => a.field === b.field && a.value === b.value
        )
      )
      .subscribe(({ field, value }) => {
        this.emitFilter(field, value);
      });
  }

  onViewDetails(transportId: string): void {
    this.viewDetails.emit(transportId);
  }

  onSort(field: string): void {
    if (this.currentSortField === field) {
      this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortField = field;
      this.currentSortOrder = 'asc';
    }

    this.sortChange.emit({
      field: this.currentSortField,
      order: this.currentSortOrder,
    });
  }

  onFilterChange(field: string, value: string): void {
    this.filterSubject.next({ field, value });
  }

  private emitFilter(field: string, value: string): void {
    // Convert to appropriate type and emit
    let filterValue: string | number | null = value.trim();

    if (field === 'yearMin' || field === 'yearMax') {
      filterValue = value ? parseInt(value, 10) : null;
    } else if (filterValue === '') {
      filterValue = null;
    }

    this.filterChange.emit({ field, value: filterValue });
  }

  get hasResults(): boolean {
    return this.vehicles.length > 0;
  }
}
