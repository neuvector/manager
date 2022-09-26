import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPanelComponent } from './security-events-panel.component';

describe('SecurityEventsPanelComponent', () => {
  let component: SecurityEventsPanelComponent;
  let fixture: ComponentFixture<SecurityEventsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityEventsPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
