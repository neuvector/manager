import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainersGridStatusCellComponent } from './containers-grid-status-cell.component';

describe('ContainersGridStatusCellComponent', () => {
  let component: ContainersGridStatusCellComponent;
  let fixture: ComponentFixture<ContainersGridStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContainersGridStatusCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainersGridStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
