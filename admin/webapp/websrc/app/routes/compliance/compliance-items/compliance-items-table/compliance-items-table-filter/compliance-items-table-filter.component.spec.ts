import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsTableFilterComponent } from './compliance-items-table-filter.component';

describe('ComplianceItemsTableFilterComponent', () => {
  let component: ComplianceItemsTableFilterComponent;
  let fixture: ComponentFixture<ComplianceItemsTableFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceItemsTableFilterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsTableFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
