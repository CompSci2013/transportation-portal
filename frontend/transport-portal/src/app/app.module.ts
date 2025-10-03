import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AircraftSearchComponent } from './components/aircraft-search/aircraft-search.component';
import { AircraftDetailComponent } from './components/aircraft-detail/aircraft-detail.component';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';
import { HistogramComponent } from './components/histogram/histogram.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ResultsTableComponent } from './components/results-table/results-table.component';
import { ManufacturerStatePickerComponent } from './components/manufacturer-state-picker/manufacturer-state-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    AircraftSearchComponent,
    AircraftDetailComponent,
    StatisticsDashboardComponent,
    HistogramComponent,
    PaginationComponent,
    ResultsTableComponent,
    ManufacturerStatePickerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
