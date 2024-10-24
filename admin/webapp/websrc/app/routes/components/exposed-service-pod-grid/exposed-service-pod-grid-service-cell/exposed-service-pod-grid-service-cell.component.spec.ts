import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposedServicePodGridServiceCellComponent } from './exposed-service-pod-grid-service-cell.component';

describe('ExposedServicePodGridServiceCellComponent', () => {
  let component: ExposedServicePodGridServiceCellComponent;
  let fixture: ComponentFixture<ExposedServicePodGridServiceCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExposedServicePodGridServiceCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ExposedServicePodGridServiceCellComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
