import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposedServicepodConvGridComponent } from './exposed-servicepod-conv-grid.component';

describe('ExposedServicepodConvGridComponent', () => {
  let component: ExposedServicepodConvGridComponent;
  let fixture: ComponentFixture<ExposedServicepodConvGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExposedServicepodConvGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposedServicepodConvGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
