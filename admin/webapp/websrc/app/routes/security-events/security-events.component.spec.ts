import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsComponent } from './security-events.component';

describe('SecurityEventsComponent', () => {
  let component: SecurityEventsComponent;
  let fixture: ComponentFixture<SecurityEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityEventsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
