import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceProfileComponent } from './compliance-profile.component';

describe('ComplianceProfileComponent', () => {
  let component: ComplianceProfileComponent;
  let fixture: ComponentFixture<ComplianceProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
