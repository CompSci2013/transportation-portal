import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AircraftSearchComponent } from './components/aircraft-search/aircraft-search.component';
import { AircraftDetailComponent } from './components/aircraft-detail/aircraft-detail.component';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';
import { FilterPickerComponent } from './shared/filter-picker/filter-picker.component';
import { ManufacturerStatePickerComponent } from './components/manufacturer-state-picker/manufacturer-state-picker.component';
import { ManufacturerStateTablePickerComponent } from './shared/manufacturer-state-table-picker/manufacturer-state-table-picker.component';
import { HistogramComponent } from './components/histogram/histogram.component';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ResultsTableComponent } from './components/results-table/results-table.component';

@NgModule({
  declarations: [
    AppComponent,
    AircraftSearchComponent,
    AircraftDetailComponent,
    StatisticsDashboardComponent,
    FilterPickerComponent,
    ManufacturerStatePickerComponent,
    ManufacturerStateTablePickerComponent,
    HistogramComponent,
    SearchFormComponent,
    SearchPageComponent,
    PaginationComponent,
    ResultsTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
