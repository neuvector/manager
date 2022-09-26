import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditRoleDialogComponent } from './add-edit-role-dialog.component';

describe('AddEditRoleDialogComponent', () => {
  let component: AddEditRoleDialogComponent;
  let fixture: ComponentFixture<AddEditRoleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditRoleDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
