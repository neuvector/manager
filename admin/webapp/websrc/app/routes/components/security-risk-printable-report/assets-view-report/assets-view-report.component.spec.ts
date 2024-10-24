import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsViewReportComponent } from './assets-view-report.component';

describe('AssetsViewReportComponent', () => {
  let component: AssetsViewReportComponent;
  let fixture: ComponentFixture<AssetsViewReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetsViewReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsViewReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
