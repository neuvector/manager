import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationCellComponent } from './operation-cell.component';

describe('OperationCellComponent', () => {
  let component: OperationCellComponent;
  let fixture: ComponentFixture<OperationCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperationCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
