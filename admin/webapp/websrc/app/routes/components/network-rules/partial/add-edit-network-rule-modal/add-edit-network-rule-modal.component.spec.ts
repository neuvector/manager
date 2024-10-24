import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditNetworkRuleModalComponent } from './add-edit-network-rule-modal.component';

describe('AddEditNetworkRuleModalComponent', () => {
  let component: AddEditNetworkRuleModalComponent;
  let fixture: ComponentFixture<AddEditNetworkRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditNetworkRuleModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditNetworkRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
