import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskAssetsLegendComponent } from './risk-assets-legend.component';

describe('RiskAssetsLegendComponent', () => {
  let component: RiskAssetsLegendComponent;
  let fixture: ComponentFixture<RiskAssetsLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskAssetsLegendComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAssetsLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
