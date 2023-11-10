import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposedServicepodGridServicepodCellComponent } from './exposed-servicepod-grid-servicepod-cell.component';

describe('ExposedServicepodGridServicepodCellComponent', () => {
  let component: ExposedServicepodGridServicepodCellComponent;
  let fixture: ComponentFixture<ExposedServicepodGridServicepodCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExposedServicepodGridServicepodCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposedServicepodGridServicepodCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
