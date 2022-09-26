import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopVulnerableAssetsPanelComponent } from './top-vulnerable-assets-panel.component';

describe('TopVulnerableAssetsPanelComponent', () => {
  let component: TopVulnerableAssetsPanelComponent;
  let fixture: ComponentFixture<TopVulnerableAssetsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopVulnerableAssetsPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopVulnerableAssetsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
