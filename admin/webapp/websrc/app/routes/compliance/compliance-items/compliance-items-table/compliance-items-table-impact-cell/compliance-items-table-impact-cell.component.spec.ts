import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsTableImpactCellComponent } from './compliance-items-table-impact-cell.component';

describe('ComplianceItemsTableImpactCellComponent', () => {
  let component: ComplianceItemsTableImpactCellComponent;
  let fixture: ComponentFixture<ComplianceItemsTableImpactCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceItemsTableImpactCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsTableImpactCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
