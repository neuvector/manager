import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsTableStatusCellComponent } from './compliance-items-table-status-cell.component';

describe('ComplianceItemsTableStatusCellComponent', () => {
  let component: ComplianceItemsTableStatusCellComponent;
  let fixture: ComponentFixture<ComplianceItemsTableStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceItemsTableStatusCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsTableStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
