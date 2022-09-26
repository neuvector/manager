import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditSensorModalComponent } from './add-edit-sensor-modal.component';

describe('AddEditSensorModalComponent', () => {
  let component: AddEditSensorModalComponent;
  let fixture: ComponentFixture<AddEditSensorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditSensorModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditSensorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
