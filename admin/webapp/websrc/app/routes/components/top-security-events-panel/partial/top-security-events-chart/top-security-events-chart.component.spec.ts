import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopSecurityEventsChartComponent } from './top-security-events-chart.component';

describe('TopSecurityEventsChartComponent', () => {
  let component: TopSecurityEventsChartComponent;
  let fixture: ComponentFixture<TopSecurityEventsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopSecurityEventsChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopSecurityEventsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
