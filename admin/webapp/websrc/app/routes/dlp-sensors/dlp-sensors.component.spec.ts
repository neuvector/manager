import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlpSensorsComponent } from './dlp-sensors.component';

describe('DlpSensorsComponent', () => {
  let component: DlpSensorsComponent;
  let fixture: ComponentFixture<DlpSensorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DlpSensorsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DlpSensorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
