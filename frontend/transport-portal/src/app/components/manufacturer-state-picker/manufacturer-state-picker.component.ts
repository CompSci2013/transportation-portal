import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FilterOption } from '../../shared/filter-picker/filter-picker.component';

interface ManufacturerStateCombination {
  manufacturer: string;
  state: string;
  count: number;
}

@Component({
  selector: 'app-manufacturer-state-picker',
  templateUrl: './manufacturer-state-picker.component.html',
  styleUrls: ['./manufacturer-state-picker.component.scss']
})
export class ManufacturerStatePickerComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<{manufacturer: string, state: string}>();
  
  options: FilterOption[] = [];
  loading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 50;
  searchTerm: string = '';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    this.loading = true;
    
    this.apiService.getManufacturerStateCombinations(
      this.currentPage, 
      this.pageSize, 
      this.searchTerm
    ).subscribe({
      next: (response) => {
        this.options = response.items.map(item => ({
          value: `${item.manufacturer}|${item.state}`,
          label: `${item.manufacturer} - ${item.state}`,
          count: item.count
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load manufacturer-state combinations:', error);
        this.loading = false;
      }
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.loadOptions();
  }

  onSelectionChange(value: string): void {
    if (!value) {
      this.selectionChange.emit({ manufacturer: '', state: '' });
      return;
    }

    const [manufacturer, state] = value.split('|');
    this.selectionChange.emit({ manufacturer, state });
  }
}
