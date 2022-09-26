import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportsComponent } from './risk-reports.component';

describe('RiskReportsComponent', () => {
  let component: RiskReportsComponent;
  let fixture: ComponentFixture<RiskReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
