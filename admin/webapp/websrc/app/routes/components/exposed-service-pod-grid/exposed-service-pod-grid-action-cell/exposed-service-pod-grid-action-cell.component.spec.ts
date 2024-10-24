import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposedServicePodGridActionCellComponent } from './exposed-service-pod-grid-action-cell.component';

describe('ExposedServicePodGridActionCellComponent', () => {
  let component: ExposedServicePodGridActionCellComponent;
  let fixture: ComponentFixture<ExposedServicePodGridActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExposedServicePodGridActionCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposedServicePodGridActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
