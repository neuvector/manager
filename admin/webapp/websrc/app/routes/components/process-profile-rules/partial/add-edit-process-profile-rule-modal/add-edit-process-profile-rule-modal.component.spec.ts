import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditProcessProfileRuleModalComponent } from './add-edit-process-profile-rule-modal.component';

describe('AddEditProcessProfileRuleModalComponent', () => {
  let component: AddEditProcessProfileRuleModalComponent;
  let fixture: ComponentFixture<AddEditProcessProfileRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditProcessProfileRuleModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditProcessProfileRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
