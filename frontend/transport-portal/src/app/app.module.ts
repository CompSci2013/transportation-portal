import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Feature: Search - Pages
import { SearchPageComponent } from './features/search/pages/search-page/search-page.component';
import { AircraftDetailComponent } from './features/search/pages/aircraft-detail/aircraft-detail.component';
import { StatisticsDashboardComponent } from './features/search/pages/statistics-dashboard/statistics-dashboard.component';

// Feature: Search - Components
import { SearchFormComponent } from './features/search/components/search-form/search-form.component';
import { ResultsTableComponent } from './features/search/components/results-table/results-table.component';
import { ManufacturerStatePickerComponent } from './features/search/components/manufacturer-state-picker/manufacturer-state-picker.component';
import { ManufacturerStateTablePickerComponent } from './features/search/components/manufacturer-state-table-picker/manufacturer-state-table-picker.component';

// Shared Components
import { HistogramComponent } from './shared/components/histogram/histogram.component';
import { PaginationComponent } from './shared/components/pagination/pagination.component';
import { FilterPickerComponent } from './shared/components/filter-picker/filter-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    // Search Pages
    SearchPageComponent,
    AircraftDetailComponent,
    StatisticsDashboardComponent,
    // Search Components
    SearchFormComponent,
    ResultsTableComponent,
    ManufacturerStatePickerComponent,
    ManufacturerStateTablePickerComponent,
    // Shared Components
    HistogramComponent,
    PaginationComponent,
    FilterPickerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
