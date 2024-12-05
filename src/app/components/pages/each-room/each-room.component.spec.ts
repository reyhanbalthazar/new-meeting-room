import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EachRoomComponent } from './each-room.component';

describe('EachRoomComponent', () => {
  let component: EachRoomComponent;
  let fixture: ComponentFixture<EachRoomComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EachRoomComponent]
    });
    fixture = TestBed.createComponent(EachRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
