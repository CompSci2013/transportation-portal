import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Aircraft, SearchResponse } from '../../models/aircraft.model';

@Component({
  selector: 'app-aircraft-search',
  templateUrl: './aircraft-search.component.html',
  styleUrls: ['./aircraft-search.component.scss']
})
export class AircraftSearchComponent implements OnInit {
  aircraft: Aircraft[] = [];
  loading = false;
  error: string | null = null;
  totalRecords = 0;
  
  // Filter properties
  manufacturer = '';
  model = '';
  yearMin: number | null = null;
  yearMax: number | null = null;
  state = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 20;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.searchAircraft();
  }

  searchAircraft(): void {
    this.loading = true;
    this.error = null;
    
    const filters: any = {
      from: this.currentPage * this.pageSize,
      size: this.pageSize
    };
    
    if (this.manufacturer.trim()) filters.manufacturer = this.manufacturer.trim();
    if (this.model.trim()) filters.model = this.model.trim();
    if (this.yearMin) filters.year_min = this.yearMin;
    if (this.yearMax) filters.year_max = this.yearMax;
    if (this.state.trim()) filters.state = this.state.trim();
    
    this.apiService.searchAircraft(filters).subscribe({
      next: (response: SearchResponse) => {
        this.aircraft = response.results;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load aircraft data. Please try again.';
        this.loading = false;
        console.error('Search error:', err);
      }
    });
  }

  resetFilters(): void {
    this.manufacturer = '';
    this.model = '';
    this.yearMin = null;
    this.yearMax = null;
    this.state = '';
    this.currentPage = 0;
    this.searchAircraft();
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.totalRecords) {
      this.currentPage++;
      this.searchAircraft();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.searchAircraft();
    }
  }

  get hasNextPage(): boolean {
    return (this.currentPage + 1) * this.pageSize < this.totalRecords;
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  get displayedRange(): string {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalRecords);
    return `${start}-${end} of ${this.totalRecords}`;
  }
}
