import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsDetailsComponent } from './compliance-items-details.component';

describe('ComplianceItemsDetailsComponent', () => {
  let component: ComplianceItemsDetailsComponent;
  let fixture: ComponentFixture<ComplianceItemsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceItemsDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
