import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsTableCsvCellComponent } from './compliance-items-table-csv-cell.component';

describe('ComplianceItemsTableCsvCellComponent', () => {
  let component: ComplianceItemsTableCsvCellComponent;
  let fixture: ComponentFixture<ComplianceItemsTableCsvCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceItemsTableCsvCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsTableCsvCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
