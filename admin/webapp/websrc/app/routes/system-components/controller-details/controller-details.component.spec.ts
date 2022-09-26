import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControllerDetailsComponent } from './controller-details.component';

describe('ControllerDetailsComponent', () => {
  let component: ControllerDetailsComponent;
  let fixture: ComponentFixture<ControllerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControllerDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControllerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
