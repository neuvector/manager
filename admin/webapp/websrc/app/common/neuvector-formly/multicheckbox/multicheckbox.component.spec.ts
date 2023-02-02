import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MulticheckboxComponent } from './multicheckbox.component';

describe('MulticheckboxComponent', () => {
  let component: MulticheckboxComponent;
  let fixture: ComponentFixture<MulticheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MulticheckboxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MulticheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
