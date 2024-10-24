import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsViewReportAssetsPodsTableComponent } from './assets-view-report-assets-pods-table.component';

describe('AssetsViewReportAssetsPodsTableComponent', () => {
  let component: AssetsViewReportAssetsPodsTableComponent;
  let fixture: ComponentFixture<AssetsViewReportAssetsPodsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetsViewReportAssetsPodsTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsViewReportAssetsPodsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
