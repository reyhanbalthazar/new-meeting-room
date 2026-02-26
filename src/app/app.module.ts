// ANGULAR CORE SYSTEM IMPORT
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

// COMPONENTS IMPORT
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/pages/home/home.component';
import { HeaderComponent } from './components/pages/home/partials/header/header.component';
import { FooterComponent } from './components/pages/home/partials/footer/footer.component';
import { DataDisplayComponent } from './data-display/data-display.component';
import { BookingFormComponent } from './booking-form/booking-form.component';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { BookingModalComponent } from './booking-modal/booking-modal.component';
import { DeleteSuccessComponent } from './delete-success/delete-success.component';
import { EachRoomComponent } from './components/pages/each-room/each-room.component';
import { CancelModalComponent } from './cancel-modal/cancel-modal.component';
import { AddParticipantModalComponent } from './add-participant-modal/add-participant-modal.component';
import { CancelBookingModalComponent } from './cancel-booking-modal/cancel-booking-modal.component';
import { DisasterAlertModalComponent } from './disaster-alert-modal/disaster-alert-modal.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    DataDisplayComponent,
    BookingFormComponent,
    BookingModalComponent,
    FooterComponent,
    DeleteSuccessComponent,
    EachRoomComponent,
    CancelModalComponent,
    AddParticipantModalComponent,
    CancelBookingModalComponent,
    DisasterAlertModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatDialogModule,
    MatMenuModule,
    MatIconModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule { }
