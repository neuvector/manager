import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodInfoComponent } from './pod-info.component';

describe('PodInfoComponent', () => {
  let component: PodInfoComponent;
  let fixture: ComponentFixture<PodInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
