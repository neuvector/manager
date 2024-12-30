import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleActionButtonsComponent } from './rule-action-buttons.component';

describe('RuleActionButtonsComponent', () => {
  let component: RuleActionButtonsComponent;
  let fixture: ComponentFixture<RuleActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RuleActionButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
