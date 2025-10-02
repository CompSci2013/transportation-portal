import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AircraftSearchComponent } from './components/aircraft-search/aircraft-search.component';
import { AircraftDetailComponent } from './components/aircraft-detail/aircraft-detail.component';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: 'search', component: AircraftSearchComponent },
  { path: 'aircraft/:id', component: AircraftDetailComponent },
  { path: 'statistics', component: StatisticsDashboardComponent },
  { path: '**', redirectTo: '/search' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
