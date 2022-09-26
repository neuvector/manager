import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistryDetailsVulnerabilitiesCellComponent } from './registry-details-vulnerabilities-cell.component';

describe('VulnerabilitiesCellComponent', () => {
  let component: RegistryDetailsVulnerabilitiesCellComponent;
  let fixture: ComponentFixture<RegistryDetailsVulnerabilitiesCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistryDetailsVulnerabilitiesCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      RegistryDetailsVulnerabilitiesCellComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
