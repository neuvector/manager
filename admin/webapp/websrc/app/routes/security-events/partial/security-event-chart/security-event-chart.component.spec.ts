import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventChartComponent } from './security-event-chart.component';

describe('SecurityEventChartComponent', () => {
  let component: SecurityEventChartComponent;
  let fixture: ComponentFixture<SecurityEventChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityEventChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
