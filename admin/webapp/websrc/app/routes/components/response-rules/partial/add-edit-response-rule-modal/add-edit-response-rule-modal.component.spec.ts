import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditResponseRuleModalComponent } from './add-edit-response-rule-modal.component';

describe('AddEditResponseRuleModalComponent', () => {
  let component: AddEditResponseRuleModalComponent;
  let fixture: ComponentFixture<AddEditResponseRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditResponseRuleModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditResponseRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
