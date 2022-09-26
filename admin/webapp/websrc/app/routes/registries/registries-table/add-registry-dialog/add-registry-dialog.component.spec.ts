import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRegistryDialogComponent } from './add-registry-dialog.component';

describe('AddRegistryDialogComponent', () => {
  let component: AddRegistryDialogComponent;
  let fixture: ComponentFixture<AddRegistryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddRegistryDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRegistryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
