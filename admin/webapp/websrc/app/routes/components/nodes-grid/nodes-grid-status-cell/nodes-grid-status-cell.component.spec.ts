import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodesGridStatusCellComponent } from './nodes-grid-status-cell.component';

describe('NodesGridStatusCellComponent', () => {
  let component: NodesGridStatusCellComponent;
  let fixture: ComponentFixture<NodesGridStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodesGridStatusCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodesGridStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
