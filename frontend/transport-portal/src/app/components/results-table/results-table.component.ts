import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TransportVehicle } from '../../models';

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss']
})
export class ResultsTableComponent {
  @Input() vehicles: TransportVehicle[] = [];
  @Input() loading: boolean = false;
  @Output() viewDetails = new EventEmitter<string>();

  onViewDetails(transportId: string): void {
    this.viewDetails.emit(transportId);
  }

  get hasResults(): boolean {
    return this.vehicles.length > 0;
  }
}
