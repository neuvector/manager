import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannersGridComponent } from './scanners-grid.component';

describe('ScannersGridComponent', () => {
  let component: ScannersGridComponent;
  let fixture: ComponentFixture<ScannersGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScannersGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScannersGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
