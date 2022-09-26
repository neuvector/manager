import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridNameCellComponent } from './events-grid-name-cell.component';

describe('EventsGridNameCellComponent', () => {
  let component: EventsGridNameCellComponent;
  let fixture: ComponentFixture<EventsGridNameCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsGridNameCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridNameCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
