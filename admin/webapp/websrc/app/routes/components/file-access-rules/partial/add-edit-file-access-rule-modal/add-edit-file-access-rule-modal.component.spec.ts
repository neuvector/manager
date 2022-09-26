import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFileAccessRuleModalComponent } from './add-edit-file-access-rule-modal.component';

describe('AddEditFileAccessRuleModalComponent', () => {
  let component: AddEditFileAccessRuleModalComponent;
  let fixture: ComponentFixture<AddEditFileAccessRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditFileAccessRuleModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditFileAccessRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
