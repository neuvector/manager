import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainersGridNameCellComponent } from './containers-grid-name-cell.component';

describe('ContainersGridNameCellComponent', () => {
  let component: ContainersGridNameCellComponent;
  let fixture: ComponentFixture<ContainersGridNameCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContainersGridNameCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainersGridNameCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
