import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceGridCategoryCellComponent } from './compliance-grid-category-cell.component';

describe('ComplianceGridCategoryCellComponent', () => {
  let component: ComplianceGridCategoryCellComponent;
  let fixture: ComponentFixture<ComplianceGridCategoryCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceGridCategoryCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceGridCategoryCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
