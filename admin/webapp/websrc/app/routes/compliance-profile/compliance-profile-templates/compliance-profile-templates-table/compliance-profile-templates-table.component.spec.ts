import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceProfileTemplatesTableComponent } from './compliance-profile-templates-table.component';

describe('ComplianceProfileTemplatesTableComponent', () => {
  let component: ComplianceProfileTemplatesTableComponent;
  let fixture: ComponentFixture<ComplianceProfileTemplatesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceProfileTemplatesTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceProfileTemplatesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
