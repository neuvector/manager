import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopVulnerableAssetsChartComponent } from './top-vulnerable-assets-chart.component';

describe('TopVulnerableAssetsChartComponent', () => {
  let component: TopVulnerableAssetsChartComponent;
  let fixture: ComponentFixture<TopVulnerableAssetsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopVulnerableAssetsChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopVulnerableAssetsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
