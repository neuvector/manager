import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgGridNoRowOverlayComponent } from './ag-grid-no-row-overlay.component';

describe('AgGridNoRowOverlayComponent', () => {
  let component: AgGridNoRowOverlayComponent;
  let fixture: ComponentFixture<AgGridNoRowOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgGridNoRowOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgGridNoRowOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
