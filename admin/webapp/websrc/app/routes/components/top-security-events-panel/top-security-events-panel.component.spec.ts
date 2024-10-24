import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopSecurityEventsPanelComponent } from './top-security-events-panel.component';

describe('TopSecurityEventsPanelComponent', () => {
  let component: TopSecurityEventsPanelComponent;
  let fixture: ComponentFixture<TopSecurityEventsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopSecurityEventsPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopSecurityEventsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
