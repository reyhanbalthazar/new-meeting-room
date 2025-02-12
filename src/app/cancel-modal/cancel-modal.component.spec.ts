import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelModalComponent } from './cancel-modal.component';

describe('CancelModalComponent', () => {
  let component: CancelModalComponent;
  let fixture: ComponentFixture<CancelModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CancelModalComponent]
    });
    fixture = TestBed.createComponent(CancelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
