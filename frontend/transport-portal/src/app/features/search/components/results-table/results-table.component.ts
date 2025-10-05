import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TransportVehicle } from '../../../../models';

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss'],
})
export class ResultsTableComponent {
  @Input() vehicles: TransportVehicle[] = [];
  @Input() loading: boolean = false;
  @Input() totalRecords: number = 0;
  @Output() viewDetails = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{
    field: string;
    order: 'asc' | 'desc';
  }>();

  onViewDetails(transportId: string): void {
    this.viewDetails.emit(transportId);
  }

  onLazyLoad(event: any): void {
    if (event.sortField) {
      const order = event.sortOrder === 1 ? 'asc' : 'desc';
      this.sortChange.emit({
        field: event.sortField,
        order: order,
      });
    }
  }

  get hasResults(): boolean {
    return this.vehicles.length > 0;
  }
}
