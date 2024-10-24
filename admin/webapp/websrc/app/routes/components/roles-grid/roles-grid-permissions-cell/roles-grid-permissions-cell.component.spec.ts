import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesGridPermissionsCellComponent } from './roles-grid-permissions-cell.component';

describe('RolesGridPermissionsCellComponent', () => {
  let component: RolesGridPermissionsCellComponent;
  let fixture: ComponentFixture<RolesGridPermissionsCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RolesGridPermissionsCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RolesGridPermissionsCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
