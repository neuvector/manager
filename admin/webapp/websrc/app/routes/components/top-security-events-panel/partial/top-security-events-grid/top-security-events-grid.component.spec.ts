import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopSecurityEventsGridComponent } from './top-security-events-grid.component';

describe('TopSecurityEventsGridComponent', () => {
  let component: TopSecurityEventsGridComponent;
  let fixture: ComponentFixture<TopSecurityEventsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopSecurityEventsGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopSecurityEventsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
