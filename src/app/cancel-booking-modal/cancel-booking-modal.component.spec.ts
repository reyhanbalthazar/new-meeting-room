import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CancelBookingModalComponent } from './cancel-booking-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CancelBookingModalComponent', () => {
  let component: CancelBookingModalComponent;
  let fixture: ComponentFixture<CancelBookingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CancelBookingModalComponent],
      providers: [
        ApiService,
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: {
            bookingId: 1,
            bookingEmail: 'test@example.com',
            title: 'Test Title',
            message: 'Test Message',
            subMessage: 'Test Sub Message',
            button1: 'Button 1',
            button2: 'Button 2',
            type: 'confirmation'
          } 
        },
        { 
          provide: MatDialogRef, 
          useValue: { close: jasmine.createSpy('close') } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CancelBookingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should verify email and cancel booking when email matches', () => {
    spyOn(component.dialogRef, 'close');
    spyOn(component['apiService'], 'deleteBooking').and.returnValue({
      subscribe: (callbacks: any) => callbacks.next({})
    } as any);
    
    component.enteredEmail = 'test@example.com';
    component.data.bookingEmail = 'test@example.com';
    
    component.verifyEmailAndCancel();
    
    expect(component['apiService'].deleteBooking).toHaveBeenCalledWith(1);
  });

  it('should show error when email does not match', () => {
    component.enteredEmail = 'wrong@example.com';
    component.data.bookingEmail = 'test@example.com';
    
    component.verifyEmailAndCancel();
    
    expect(component.errorMessage).toBe('Email does not match!');
  });

  it('should close dialog when cancel is called', () => {
    spyOn(component.dialogRef, 'close');
    
    component.cancel();
    
    expect(component.dialogRef.close).toHaveBeenCalledWith(false);
  });
});