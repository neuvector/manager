import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsChartsComponent } from './compliance-items-charts.component';

describe('ComplianceItemsChartsComponent', () => {
  let component: ComplianceItemsChartsComponent;
  let fixture: ComponentFixture<ComplianceItemsChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceItemsChartsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
