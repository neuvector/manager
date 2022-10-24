import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsViewReportAssetsPlatformsTableComponent } from './assets-view-report-assets-platforms-table.component';

describe('AssetsViewReportAssetsPlatformsTableComponent', () => {
  let component: AssetsViewReportAssetsPlatformsTableComponent;
  let fixture: ComponentFixture<AssetsViewReportAssetsPlatformsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetsViewReportAssetsPlatformsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsViewReportAssetsPlatformsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
