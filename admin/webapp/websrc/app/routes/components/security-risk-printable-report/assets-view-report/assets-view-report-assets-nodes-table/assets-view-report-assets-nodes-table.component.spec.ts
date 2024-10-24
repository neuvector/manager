import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsViewReportAssetsNodesTableComponent } from './assets-view-report-assets-nodes-table.component';

describe('AssetsViewReportAssetsNodesTableComponent', () => {
  let component: AssetsViewReportAssetsNodesTableComponent;
  let fixture: ComponentFixture<AssetsViewReportAssetsNodesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetsViewReportAssetsNodesTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AssetsViewReportAssetsNodesTableComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
