import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryDetailsTableStatusCellComponent } from './registry-details-table-status-cell.component';

describe('RegistryDetailsTableStatusCellComponent', () => {
  let component: RegistryDetailsTableStatusCellComponent;
  let fixture: ComponentFixture<RegistryDetailsTableStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryDetailsTableStatusCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryDetailsTableStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
