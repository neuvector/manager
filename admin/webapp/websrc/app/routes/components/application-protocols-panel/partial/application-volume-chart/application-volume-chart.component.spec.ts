import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationVolumeChartComponent } from './application-volume-chart.component';

describe('ApplicationVolumeChartComponent', () => {
  let component: ApplicationVolumeChartComponent;
  let fixture: ComponentFixture<ApplicationVolumeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApplicationVolumeChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationVolumeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
