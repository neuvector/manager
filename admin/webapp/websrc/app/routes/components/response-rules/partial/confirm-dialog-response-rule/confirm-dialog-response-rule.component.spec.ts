import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogResponseRuleComponent } from './confirm-dialog-response-rule.component';

describe('ConfirmDialogResponseRuleComponent', () => {
  let component: ConfirmDialogResponseRuleComponent;
  let fixture: ComponentFixture<ConfirmDialogResponseRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmDialogResponseRuleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDialogResponseRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
