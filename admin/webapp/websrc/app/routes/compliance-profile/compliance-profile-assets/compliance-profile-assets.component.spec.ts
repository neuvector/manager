import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceProfileAssetsComponent } from './compliance-profile-assets.component';

describe('ComplianceProfileAssetsComponent', () => {
  let component: ComplianceProfileAssetsComponent;
  let fixture: ComponentFixture<ComplianceProfileAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplianceProfileAssetsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceProfileAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
