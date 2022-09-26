import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistryVulnerabilitiesComponent } from './registry-vulnerabilities.component';

describe('RegistryVulnerabilitiesComponent', () => {
  let component: RegistryVulnerabilitiesComponent;
  let fixture: ComponentFixture<RegistryVulnerabilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryVulnerabilitiesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistryVulnerabilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
