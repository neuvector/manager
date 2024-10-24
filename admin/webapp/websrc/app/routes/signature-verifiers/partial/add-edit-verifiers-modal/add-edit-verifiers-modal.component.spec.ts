import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditVerifiersModalComponent } from './add-edit-verifiers-modal.component';

describe('AddEditVerifiersModalComponent', () => {
  let component: AddEditVerifiersModalComponent;
  let fixture: ComponentFixture<AddEditVerifiersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditVerifiersModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditVerifiersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
