import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridUserCellComponent } from './events-grid-user-cell.component';

describe('EventsGridUserCellComponent', () => {
  let component: EventsGridUserCellComponent;
  let fixture: ComponentFixture<EventsGridUserCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsGridUserCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridUserCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
