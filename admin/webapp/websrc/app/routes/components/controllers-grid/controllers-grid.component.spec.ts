import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControllersGridComponent } from './controllers-grid.component';

describe('ControllersGridComponent', () => {
  let component: ControllersGridComponent;
  let fixture: ComponentFixture<ControllersGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControllersGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControllersGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
