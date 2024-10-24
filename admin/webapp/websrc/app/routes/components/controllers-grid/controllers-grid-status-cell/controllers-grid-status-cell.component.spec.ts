import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControllersGridStatusCellComponent } from './controllers-grid-status-cell.component';

describe('ControllersGridStatusCellComponent', () => {
  let component: ControllersGridStatusCellComponent;
  let fixture: ComponentFixture<ControllersGridStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ControllersGridStatusCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControllersGridStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
