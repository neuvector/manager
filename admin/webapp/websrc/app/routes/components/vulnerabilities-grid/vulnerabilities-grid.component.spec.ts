import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VulnerabilitiesGridComponent } from './vulnerabilities-grid.component';

describe('VulnerabilitiesGridComponent', () => {
  let component: VulnerabilitiesGridComponent;
  let fixture: ComponentFixture<VulnerabilitiesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VulnerabilitiesGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VulnerabilitiesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
