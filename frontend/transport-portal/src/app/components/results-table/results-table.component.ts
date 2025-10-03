import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Aircraft } from '../../models';

@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss']
})
export class ResultsTableComponent {
  @Input() aircraft: Aircraft[] = [];
  @Input() loading: boolean = false;
  @Output() viewDetails = new EventEmitter<string>();

  onViewDetails(transportId: string): void {
    this.viewDetails.emit(transportId);
  }

  get hasResults(): boolean {
    return this.aircraft.length > 0;
  }
}
