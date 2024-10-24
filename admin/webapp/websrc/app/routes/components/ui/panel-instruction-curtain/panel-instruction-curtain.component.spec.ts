import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelInstructionCurtainComponent } from './panel-instruction-curtain.component';

describe('PanelInstructionCurtainComponent', () => {
  let component: PanelInstructionCurtainComponent;
  let fixture: ComponentFixture<PanelInstructionCurtainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PanelInstructionCurtainComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelInstructionCurtainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
