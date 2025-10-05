import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TransportVehicle } from '../../../../models/transport-vehicle.model';

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss'],
})
export class ResultsTableComponent implements OnInit, OnDestroy {
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSort(field: string, order: string | null) {
    if (!order) {
      // When sort is cleared, don't emit - just return
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
