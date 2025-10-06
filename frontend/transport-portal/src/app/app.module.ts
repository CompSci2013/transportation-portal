import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// NG-ZORRO imports
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';

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
    FilterPickerComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // NG-ZORRO modules
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
    NzCheckboxModule,
  ],
  providers: [{ provide: NZ_I18N, useValue: en_US }],
  bootstrap: [AppComponent],
})
export class AppModule {}
