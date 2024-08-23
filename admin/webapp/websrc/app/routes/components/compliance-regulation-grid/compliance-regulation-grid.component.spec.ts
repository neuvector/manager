import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceRegulationGridComponent } from './compliance-regulation-grid.component';

describe('ComplianceRegulationGridComponent', () => {
  let component: ComplianceRegulationGridComponent;
  let fixture: ComponentFixture<ComplianceRegulationGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceRegulationGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceRegulationGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
