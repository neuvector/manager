import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexCellComponent } from './index-cell.component';

describe('IndexCellComponent', () => {
  let component: IndexCellComponent;
  let fixture: ComponentFixture<IndexCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndexCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
