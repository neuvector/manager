import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridMessageCellComponent } from './events-grid-message-cell.component';

describe('EventsGridMessageCellComponent', () => {
  let component: EventsGridMessageCellComponent;
  let fixture: ComponentFixture<EventsGridMessageCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsGridMessageCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridMessageCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
