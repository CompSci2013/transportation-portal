import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export interface HistogramData {
  label: string;
  count: number;
}

@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.scss']
})
export class HistogramComponent implements OnChanges {
  @Input() title: string = 'Distribution';
  @Input() data: HistogramData[] = [];
  @Input() clickable: boolean = true;
  @Input() selectedLabel: string | null = null;
  @Input() maxHeight: string = '500px'; // Scrollable container height
  @Output() barClick = new EventEmitter<string>();

  displayData: HistogramData[] = [];
  maxCount: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.updateDisplayData();
    }
  }

  private updateDisplayData(): void {
    if (!this.data || this.data.length === 0) {
      this.displayData = [];
      this.maxCount = 0;
      return;
    }

    // Sort by count descending and show ALL items
    const sorted = [...this.data].sort((a, b) => b.count - a.count);
    this.displayData = sorted;
    this.maxCount = this.displayData[0]?.count || 0;
  }

  getBarWidth(count: number): string {
    if (this.maxCount === 0) return '0%';
    const percentage = (count / this.maxCount) * 100;
    return `${Math.max(percentage, 2)}%`; // Minimum 2% for visibility
  }

  onBarClick(label: string): void {
    if (this.clickable) {
      this.barClick.emit(label);
    }
  }

  isSelected(label: string): boolean {
    return this.selectedLabel === label;
  }

  get totalCount(): number {
    return this.displayData.reduce((sum, item) => sum + item.count, 0);
  }

  get hasData(): boolean {
    return this.displayData.length > 0;
  }
}
