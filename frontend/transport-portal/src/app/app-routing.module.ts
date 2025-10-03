import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { AircraftDetailComponent } from './components/aircraft-detail/aircraft-detail.component';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';

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
