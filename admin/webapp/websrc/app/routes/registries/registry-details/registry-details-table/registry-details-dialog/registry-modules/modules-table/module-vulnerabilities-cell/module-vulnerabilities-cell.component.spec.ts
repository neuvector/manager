import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleVulnerabilitiesCellComponent } from './module-vulnerabilities-cell.component';

describe('ModuleVulnerabilitiesCellComponent', () => {
  let component: ModuleVulnerabilitiesCellComponent;
  let fixture: ComponentFixture<ModuleVulnerabilitiesCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModuleVulnerabilitiesCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuleVulnerabilitiesCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
