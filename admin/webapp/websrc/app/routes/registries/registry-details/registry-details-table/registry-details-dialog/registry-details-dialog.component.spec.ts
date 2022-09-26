import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryDetailsDialogComponent } from './registry-details-dialog.component';

describe('RegistryDetailsDialogComponent', () => {
  let component: RegistryDetailsDialogComponent;
  let fixture: ComponentFixture<RegistryDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryDetailsDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
