import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridLocationCellComponent } from './events-grid-location-cell.component';

describe('EventsGridLocationCellComponent', () => {
  let component: EventsGridLocationCellComponent;
  let fixture: ComponentFixture<EventsGridLocationCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventsGridLocationCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridLocationCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
