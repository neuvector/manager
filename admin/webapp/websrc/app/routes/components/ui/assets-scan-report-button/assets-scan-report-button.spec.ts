import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsScanReportButton } from './assets-scan-report-button';

describe('AssetsScanReportButton', () => {
  let component: AssetsScanReportButton;
  let fixture: ComponentFixture<AssetsScanReportButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsScanReportButton],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetsScanReportButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
