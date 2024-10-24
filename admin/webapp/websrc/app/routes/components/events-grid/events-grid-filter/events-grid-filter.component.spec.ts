import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridFilterComponent } from './events-grid-filter.component';

describe('EventsGridFilterComponent', () => {
  let component: EventsGridFilterComponent;
  let fixture: ComponentFixture<EventsGridFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventsGridFilterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
