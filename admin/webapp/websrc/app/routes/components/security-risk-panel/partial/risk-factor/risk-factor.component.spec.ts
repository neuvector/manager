import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskFactorComponent } from './risk-factor.component';

describe('RiskFactorComponent', () => {
  let component: RiskFactorComponent;
  let fixture: ComponentFixture<RiskFactorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskFactorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskFactorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
