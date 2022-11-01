import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningNotificationComponent } from './warning-notification.component';

describe('WarningNotificationComponent', () => {
  let component: WarningNotificationComponent;
  let fixture: ComponentFixture<WarningNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WarningNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WarningNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
