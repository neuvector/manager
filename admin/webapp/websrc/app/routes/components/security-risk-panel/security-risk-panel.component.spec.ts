import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityRiskPanelComponent } from './security-risk-panel.component';

describe('SecurityRiskPanelComponent', () => {
  let component: SecurityRiskPanelComponent;
  let fixture: ComponentFixture<SecurityRiskPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityRiskPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityRiskPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
