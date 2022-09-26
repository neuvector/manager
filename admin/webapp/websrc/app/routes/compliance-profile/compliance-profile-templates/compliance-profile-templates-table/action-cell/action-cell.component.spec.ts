import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionCellComponent } from './action-cell.component';

describe('ActionCellComponent', () => {
  let component: ActionCellComponent;
  let fixture: ComponentFixture<ActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActionCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
