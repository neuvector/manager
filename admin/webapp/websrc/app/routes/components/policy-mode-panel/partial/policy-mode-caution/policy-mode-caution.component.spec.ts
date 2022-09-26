import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyModeCautionComponent } from './policy-mode-caution.component';

describe('PolicyModeCautionComponent', () => {
  let component: PolicyModeCautionComponent;
  let fixture: ComponentFixture<PolicyModeCautionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicyModeCautionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyModeCautionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
