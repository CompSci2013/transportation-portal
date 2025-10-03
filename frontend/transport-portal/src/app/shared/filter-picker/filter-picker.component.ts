import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface FilterOption {
  value: string;
  label: string;
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
  @Output() selectionChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

  searchControl = new FormControl('');
  filteredOptions: FilterOption[] = [];

  ngOnInit(): void {
    this.filteredOptions = this.options;

    // Emit search changes with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterOptions(searchTerm || '');
      this.searchChange.emit(searchTerm || '');
    });
  }

  ngOnChanges(): void {
    // Update filtered options when input options change
    this.filterOptions(this.searchControl.value || '');
  }

  private filterOptions(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredOptions = this.options;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.label.toLowerCase().includes(term) ||
      option.value.toLowerCase().includes(term)
    );
  }

  selectOption(option: FilterOption): void {
    this.selectionChange.emit(option.value);
  }

  clearSelection(): void {
    this.searchControl.setValue('');
    this.selectionChange.emit('');
  }
}
