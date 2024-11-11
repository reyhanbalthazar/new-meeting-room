import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { DeleteSuccessComponent } from './delete-success/delete-success.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'form-booking', component: BookingFormComponent },
  { path: 'delete-success', component: DeleteSuccessComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
