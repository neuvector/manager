import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorActionButtonsComponent } from './sensor-action-buttons.component';

describe('SensorActionButtonsComponent', () => {
  let component: SensorActionButtonsComponent;
  let fixture: ComponentFixture<SensorActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SensorActionButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
