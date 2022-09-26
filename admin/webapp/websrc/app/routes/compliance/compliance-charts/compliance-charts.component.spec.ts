import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceChartsComponent } from './compliance-charts.component';

describe('ComplianceChartsComponent', () => {
  let component: ComplianceChartsComponent;
  let fixture: ComponentFixture<ComplianceChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceChartsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
