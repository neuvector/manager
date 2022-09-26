import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditAdmissionRuleModalComponent } from './add-edit-admission-rule-modal.component';

describe('AddEditAdmissionRuleModalComponent', () => {
  let component: AddEditAdmissionRuleModalComponent;
  let fixture: ComponentFixture<AddEditAdmissionRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditAdmissionRuleModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditAdmissionRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
