import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainersGridStateCellComponent } from './containers-grid-state-cell.component';

describe('ContainersGridStateCellComponent', () => {
  let component: ContainersGridStateCellComponent;
  let fixture: ComponentFixture<ContainersGridStateCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContainersGridStateCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainersGridStateCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
