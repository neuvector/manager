import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodesGridStateCellComponent } from './nodes-grid-state-cell.component';

describe('NodesGridStateCellComponent', () => {
  let component: NodesGridStateCellComponent;
  let fixture: ComponentFixture<NodesGridStateCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodesGridStateCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodesGridStateCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
