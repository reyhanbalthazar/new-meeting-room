import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddParticipantModalComponent } from './add-participant-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AddParticipantModalComponent', () => {
  let component: AddParticipantModalComponent;
  let fixture: ComponentFixture<AddParticipantModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AddParticipantModalComponent],
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

    fixture = TestBed.createComponent(AddParticipantModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should verify PIC email correctly', () => {
    component.enteredEmail = 'test@example.com';
    component.data.bookingEmail = 'test@example.com';
    
    component.verifyPicEmail();
    
    expect(component.showParticipantForm).toBe(true);
    expect(component.errorMessage).toBe('');
  });

  it('should show error when PIC email does not match', () => {
    component.enteredEmail = 'wrong@example.com';
    component.data.bookingEmail = 'test@example.com';
    
    component.verifyPicEmail();
    
    expect(component.errorMessage).toBe('Email does not match!');
  });

  it('should add participant when form is valid', () => {
    spyOn(component.dialogRef, 'close');
    component.participantName = 'John Doe';
    component.participantEmail = 'john@example.com';
    
    component.addParticipant();
    
    expect(component.dialogRef.close).toHaveBeenCalledWith({
      participantName: 'John Doe',
      participantEmail: 'john@example.com'
    });
  });

  it('should show error when participant form is invalid', () => {
    component.participantName = '';
    component.participantEmail = '';
    
    component.addParticipant();
    
    expect(component.errorMessage).toBe('Please fill in all fields');
  });
});