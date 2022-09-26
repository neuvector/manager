import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainersGridComponent } from './containers-grid.component';

describe('ContainersGridComponent', () => {
  let component: ContainersGridComponent;
  let fixture: ComponentFixture<ContainersGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContainersGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainersGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
