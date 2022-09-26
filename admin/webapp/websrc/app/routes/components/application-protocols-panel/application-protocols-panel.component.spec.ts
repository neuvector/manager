import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationProtocolsPanelComponent } from './application-protocols-panel.component';

describe('ApplicationProtocolsPanelComponent', () => {
  let component: ApplicationProtocolsPanelComponent;
  let fixture: ComponentFixture<ApplicationProtocolsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicationProtocolsPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationProtocolsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
