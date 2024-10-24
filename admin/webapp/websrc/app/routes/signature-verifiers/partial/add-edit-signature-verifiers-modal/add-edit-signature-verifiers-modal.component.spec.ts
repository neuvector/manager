import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditSignatureVerifiersModalComponent } from './add-edit-signature-verifiers-modal.component';

describe('AddEditSignatureVerifiersModalComponent', () => {
  let component: AddEditSignatureVerifiersModalComponent;
  let fixture: ComponentFixture<AddEditSignatureVerifiersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditSignatureVerifiersModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditSignatureVerifiersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
