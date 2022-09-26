import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VulnerabilitiesGridSeverityCellComponent } from './vulnerabilities-grid-severity-cell.component';

describe('VulnerabilitiesGridSeverityCellComponent', () => {
  let component: VulnerabilitiesGridSeverityCellComponent;
  let fixture: ComponentFixture<VulnerabilitiesGridSeverityCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VulnerabilitiesGridSeverityCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VulnerabilitiesGridSeverityCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
