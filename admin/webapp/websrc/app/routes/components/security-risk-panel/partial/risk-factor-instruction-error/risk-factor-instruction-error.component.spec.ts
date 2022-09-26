import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskFactorInstructionErrorComponent } from './risk-factor-instruction-error.component';

describe('RiskFactorInstructionErrorComponent', () => {
  let component: RiskFactorInstructionErrorComponent;
  let fixture: ComponentFixture<RiskFactorInstructionErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskFactorInstructionErrorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskFactorInstructionErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
