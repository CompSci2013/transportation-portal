import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TransportVehicle } from '../../../../models/transport-vehicle.model';

// Interface for grouped results
interface GroupedResult {
  manufacturer: string;
  state: string;
  count: number;
  aircraft: TransportVehicle[];
  key: string; // Combined key for tracking expansion
}

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss'],
})
export class ResultsTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() vehicles: TransportVehicle[] = [];
  @Input() totalRecords: number = 0;
  @Input() loading: boolean = false;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 20;

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
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() filterChange = new EventEmitter<{ field: string; value: string }>();

  // Grouped view properties
  viewMode: 'flat' | 'grouped' = 'flat';
  groupedData: GroupedResult[] = [];
  expandSet = new Set<string>();

  private filterSubject = new Subject<{ field: string; value: string }>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.filterSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(
          (prev, curr) => prev.field === curr.field && prev.value === curr.value
        )
      )
      .subscribe(({ field, value }) => {
        this.filterChange.emit({ field, value });
      });
    
    // Initial grouping if vehicles already loaded
    if (this.vehicles.length > 0) {
      this.groupedData = this.groupByManufacturerState(this.vehicles);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Re-group data when vehicles input changes
    if (changes['vehicles'] && this.vehicles) {
      this.groupedData = this.groupByManufacturerState(this.vehicles);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Groups aircraft by manufacturer and state
   */
  groupByManufacturerState(aircraft: TransportVehicle[]): GroupedResult[] {
    const groups = new Map<string, GroupedResult>();

    aircraft.forEach(vehicle => {
      const manufacturer = vehicle.manufacturer || 'Unknown';
      const state = vehicle.location?.state_province || 'N/A';
      const key = `${manufacturer}|${state}`;

      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.count++;
        group.aircraft.push(vehicle);
      } else {
        groups.set(key, {
          manufacturer,
          state,
          count: 1,
          aircraft: [vehicle],
          key
        });
      }
    });

    // Convert to array and sort by manufacturer, then state
    return Array.from(groups.values()).sort((a, b) => {
      if (a.manufacturer !== b.manufacturer) {
        return a.manufacturer.localeCompare(b.manufacturer);
      }
      return a.state.localeCompare(b.state);
    });
  }

  /**
   * Toggle between flat and grouped view modes
   */
  toggleViewMode() {
    this.viewMode = this.viewMode === 'flat' ? 'grouped' : 'flat';
    // Clear expansion state when switching views
    if (this.viewMode === 'flat') {
      this.expandSet.clear();
    }
  }

  /**
   * Toggle expansion of a grouped row
   */
  onExpandChange(key: string, expanded: boolean): void {
    if (expanded) {
      this.expandSet.add(key);
    } else {
      this.expandSet.delete(key);
    }
  }

  /**
   * Check if a group is expanded
   */
  isExpanded(key: string): boolean {
    return this.expandSet.has(key);
  }

  onSort(field: string, order: string | null) {
    if (!order) {
      return;
    }
    const sortOrder: 'asc' | 'desc' = order === 'ascend' ? 'asc' : 'desc';
    this.sortChange.emit({ field, order: sortOrder });
  }

  onPageChange(page: number) {
    console.log('NG-ZORRO page change:', page);
    this.pageChange.emit(page);
  }

  onPageSizeChange(size: number) {
    this.pageSizeChange.emit(size);
  }

  onFilterChange(field: string, value: string) {
    this.filterSubject.next({ field, value });
  }

  onViewDetails(transportId: string) {
    this.viewDetails.emit(transportId);
  }
}
