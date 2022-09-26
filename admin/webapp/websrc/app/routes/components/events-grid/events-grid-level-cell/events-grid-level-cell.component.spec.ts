import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsGridLevelCellComponent } from './events-grid-level-cell.component';

describe('EventsGridLevelCellComponent', () => {
  let component: EventsGridLevelCellComponent;
  let fixture: ComponentFixture<EventsGridLevelCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsGridLevelCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsGridLevelCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
