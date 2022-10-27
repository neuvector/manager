import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsViewReportAssetsImagesTableComponent } from './assets-view-report-assets-images-table.component';

describe('AssetsViewReportAssetsImagesTableComponent', () => {
  let component: AssetsViewReportAssetsImagesTableComponent;
  let fixture: ComponentFixture<AssetsViewReportAssetsImagesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetsViewReportAssetsImagesTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsViewReportAssetsImagesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
