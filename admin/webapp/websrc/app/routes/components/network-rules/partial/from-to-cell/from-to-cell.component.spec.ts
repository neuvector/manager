import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FromToCellComponent } from './from-to-cell.component';

describe('FromToCellComponent', () => {
  let component: FromToCellComponent;
  let fixture: ComponentFixture<FromToCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FromToCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FromToCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
