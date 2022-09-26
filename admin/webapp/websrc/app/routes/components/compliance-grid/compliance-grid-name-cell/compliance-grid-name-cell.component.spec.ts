import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceGridNameCellComponent } from './compliance-grid-name-cell.component';

describe('ComplianceGridNameCellComponent', () => {
  let component: ComplianceGridNameCellComponent;
  let fixture: ComponentFixture<ComplianceGridNameCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceGridNameCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceGridNameCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
