import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface FilterOption {
  value: string;
  label: string;
  manufacturer: string;
  state: string;
  count?: number;
}

@Component({
  selector: 'app-filter-picker',
  templateUrl: './filter-picker.component.html',
  styleUrls: ['./filter-picker.component.scss']
})
export class FilterPickerComponent implements OnInit {
  @Input() label: string = 'Filter';
  @Input() placeholder: string = 'Search...';
  @Input() options: FilterOption[] = [];
  @Input() loading: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() searchChange = new EventEmitter<string>();

  searchControl = new FormControl('');
  filteredOptions: FilterOption[] = [];
  selectedValues: Set<string> = new Set();

  ngOnInit(): void {
    this.filteredOptions = this.options;

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterOptions(searchTerm || '');
      this.searchChange.emit(searchTerm || '');
    });
  }

  ngOnChanges(): void {
    this.filterOptions(this.searchControl.value || '');
  }

  private filterOptions(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredOptions = this.options;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.manufacturer.toLowerCase().includes(term) ||
      option.state.toLowerCase().includes(term)
    );
  }

  toggleOption(option: FilterOption): void {
    if (this.selectedValues.has(option.value)) {
      this.selectedValues.delete(option.value);
    } else {
      this.selectedValues.add(option.value);
    }
    this.selectionChange.emit(Array.from(this.selectedValues));
  }

  isSelected(value: string): boolean {
    return this.selectedValues.has(value);
  }

  clearSelection(): void {
    this.searchControl.setValue('');
    this.selectedValues.clear();
    this.selectionChange.emit([]);
  }
}
