import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceRegulationGridDialogComponent } from './compliance-regulation-grid-dialog.component';

describe('ComplianceRegulationGridDialogComponent', () => {
  let component: ComplianceRegulationGridDialogComponent;
  let fixture: ComponentFixture<ComplianceRegulationGridDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceRegulationGridDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceRegulationGridDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
