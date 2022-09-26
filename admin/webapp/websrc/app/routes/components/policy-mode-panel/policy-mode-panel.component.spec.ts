import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyModePanelComponent } from './policy-mode-panel.component';

describe('PolicyModePanelComponent', () => {
  let component: PolicyModePanelComponent;
  let fixture: ComponentFixture<PolicyModePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicyModePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyModePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
