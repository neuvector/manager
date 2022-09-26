import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceProfileAssetsTableComponent } from './compliance-profile-assets-table.component';

describe('ComplianceProfileAssetsTableComponent', () => {
  let component: ComplianceProfileAssetsTableComponent;
  let fixture: ComponentFixture<ComplianceProfileAssetsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceProfileAssetsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceProfileAssetsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
