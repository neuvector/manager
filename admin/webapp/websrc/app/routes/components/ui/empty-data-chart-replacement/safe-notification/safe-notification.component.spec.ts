import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeNotificationComponent } from './safe-notification.component';

describe('SafeNotificationComponent', () => {
  let component: SafeNotificationComponent;
  let fixture: ComponentFixture<SafeNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SafeNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SafeNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
