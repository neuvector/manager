import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnforcersGridStatusCellComponent } from './enforcers-grid-status-cell.component';

describe('EnforcersGridStatusCellComponent', () => {
  let component: EnforcersGridStatusCellComponent;
  let fixture: ComponentFixture<EnforcersGridStatusCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnforcersGridStatusCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnforcersGridStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
