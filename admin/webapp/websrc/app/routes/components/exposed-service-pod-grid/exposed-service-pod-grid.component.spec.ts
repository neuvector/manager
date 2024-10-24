import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExposedServicePodGridComponent } from './exposed-service-pod-grid.component';

describe('ExposedServicePodGridComponent', () => {
  let component: ExposedServicePodGridComponent;
  let fixture: ComponentFixture<ExposedServicePodGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExposedServicePodGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposedServicePodGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
