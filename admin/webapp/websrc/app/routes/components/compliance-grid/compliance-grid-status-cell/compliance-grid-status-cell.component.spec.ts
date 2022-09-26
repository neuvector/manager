import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceGridStatusCellComponent } from './compliance-grid-status-cell.component';

describe('ComplianceGridStatusCellComponent', () => {
  let component: ComplianceGridStatusCellComponent;
  let fixture: ComponentFixture<ComplianceGridStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceGridStatusCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceGridStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
