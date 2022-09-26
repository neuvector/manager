import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsChartComponent } from './security-events-chart.component';

describe('SecurityEventsChartComponent', () => {
  let component: SecurityEventsChartComponent;
  let fixture: ComponentFixture<SecurityEventsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityEventsChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
