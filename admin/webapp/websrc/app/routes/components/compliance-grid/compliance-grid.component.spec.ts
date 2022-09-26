import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceGridComponent } from './compliance-grid.component';

describe('ComplianceGridComponent', () => {
  let component: ComplianceGridComponent;
  let fixture: ComponentFixture<ComplianceGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
