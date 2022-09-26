import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskInstructionComponent } from './risk-instruction.component';

describe('RiskInstructionComponent', () => {
  let component: RiskInstructionComponent;
  let fixture: ComponentFixture<RiskInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskInstructionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskInstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
