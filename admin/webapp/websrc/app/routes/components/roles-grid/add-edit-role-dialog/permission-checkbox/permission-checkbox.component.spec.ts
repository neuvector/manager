import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionCheckboxComponent } from './permission-checkbox.component';

describe('PermissionCheckboxComponent', () => {
  let component: PermissionCheckboxComponent;
  let fixture: ComponentFixture<PermissionCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PermissionCheckboxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
