import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditRuleModalComponent } from './add-edit-rule-modal.component';

describe('AddEditRuleModalComponent', () => {
  let component: AddEditRuleModalComponent;
  let fixture: ComponentFixture<AddEditRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditRuleModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
