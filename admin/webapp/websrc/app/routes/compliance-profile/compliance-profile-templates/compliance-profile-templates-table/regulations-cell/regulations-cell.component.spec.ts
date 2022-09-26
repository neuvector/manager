import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationsCellComponent } from './regulations-cell.component';

describe('RegulationsCellComponent', () => {
  let component: RegulationsCellComponent;
  let fixture: ComponentFixture<RegulationsCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegulationsCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegulationsCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
