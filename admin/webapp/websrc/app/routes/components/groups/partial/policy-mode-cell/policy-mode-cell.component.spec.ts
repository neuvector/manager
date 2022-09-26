import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyModeCellComponent } from './policy-mode-cell.component';

describe('PolicyModeCellComponent', () => {
  let component: PolicyModeCellComponent;
  let fixture: ComponentFixture<PolicyModeCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicyModeCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyModeCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
