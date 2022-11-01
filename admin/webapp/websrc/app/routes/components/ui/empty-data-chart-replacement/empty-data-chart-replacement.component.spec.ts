import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyDataChartReplacementComponent } from './empty-data-chart-replacement.component';

describe('EmptyDataChartReplacementComponent', () => {
  let component: EmptyDataChartReplacementComponent;
  let fixture: ComponentFixture<EmptyDataChartReplacementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmptyDataChartReplacementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmptyDataChartReplacementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
