import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchPageComponent } from './features/search/pages/search-page/search-page.component';
import { AircraftDetailComponent } from './features/search/pages/aircraft-detail/aircraft-detail.component';
import { StatisticsDashboardComponent } from './features/search/pages/statistics-dashboard/statistics-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: 'search', component: SearchPageComponent },
  { path: 'aircraft/:id', component: AircraftDetailComponent },
  { path: 'statistics', component: StatisticsDashboardComponent },
  { path: '**', redirectTo: '/search' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
