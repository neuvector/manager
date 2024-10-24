import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemDetailsComponent } from './compliance-item-details.component';

describe('ComplianceItemDetailsComponent', () => {
  let component: ComplianceItemDetailsComponent;
  let fixture: ComponentFixture<ComplianceItemDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceItemDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
