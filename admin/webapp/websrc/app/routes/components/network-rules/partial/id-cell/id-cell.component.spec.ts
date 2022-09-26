import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdCellComponent } from './id-cell.component';

describe('IdCellComponent', () => {
  let component: IdCellComponent;
  let fixture: ComponentFixture<IdCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
