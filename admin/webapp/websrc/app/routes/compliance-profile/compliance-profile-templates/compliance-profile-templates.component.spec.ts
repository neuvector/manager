import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceProfileTemplatesComponent } from './compliance-profile-templates.component';

describe('ComplianceProfileTemplatesComponent', () => {
  let component: ComplianceProfileTemplatesComponent;
  let fixture: ComponentFixture<ComplianceProfileTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceProfileTemplatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceProfileTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
