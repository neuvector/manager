import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridComponent } from './events-grid.component';

describe('EventsGridComponent', () => {
  let component: EventsGridComponent;
  let fixture: ComponentFixture<EventsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
