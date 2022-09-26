import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceItemsComponent } from './compliance-items.component';

describe('ComplianceItemsComponent', () => {
  let component: ComplianceItemsComponent;
  let fixture: ComponentFixture<ComplianceItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
