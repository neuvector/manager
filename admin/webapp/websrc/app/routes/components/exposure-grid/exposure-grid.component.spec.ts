import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposureGridComponent } from './exposure-grid.component';

describe('ExposureGridComponent', () => {
  let component: ExposureGridComponent;
  let fixture: ComponentFixture<ExposureGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExposureGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposureGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
