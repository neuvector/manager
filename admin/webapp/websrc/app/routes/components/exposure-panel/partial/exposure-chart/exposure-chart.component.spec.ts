import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposureChartComponent } from './exposure-chart.component';

describe('ExposureChartComponent', () => {
  let component: ExposureChartComponent;
  let fixture: ComponentFixture<ExposureChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExposureChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposureChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
