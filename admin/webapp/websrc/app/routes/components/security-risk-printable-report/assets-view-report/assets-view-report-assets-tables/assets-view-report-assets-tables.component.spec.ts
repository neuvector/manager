import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsViewReportAssetsTablesComponent } from './assets-view-report-assets-tables.component';

describe('AssetsViewReportAssetsTablesComponent', () => {
  let component: AssetsViewReportAssetsTablesComponent;
  let fixture: ComponentFixture<AssetsViewReportAssetsTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetsViewReportAssetsTablesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsViewReportAssetsTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
