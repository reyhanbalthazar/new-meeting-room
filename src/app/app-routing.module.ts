import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { DeleteSuccessComponent } from './delete-success/delete-success.component';
import { EachRoomComponent } from './components/pages/each-room/each-room.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'form-booking', component: BookingFormComponent },
  { path: 'delete-success', component: DeleteSuccessComponent },
  { path: 'room/:id', component: EachRoomComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
