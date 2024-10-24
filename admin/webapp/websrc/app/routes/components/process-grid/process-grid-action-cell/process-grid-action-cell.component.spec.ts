import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessGridActionCellComponent } from './process-grid-action-cell.component';

describe('ProcessGridActionCellComponent', () => {
  let component: ProcessGridActionCellComponent;
  let fixture: ComponentFixture<ProcessGridActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessGridActionCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessGridActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
