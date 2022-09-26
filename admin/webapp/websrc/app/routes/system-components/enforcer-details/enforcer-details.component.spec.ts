import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnforcerDetailsComponent } from './enforcer-details.component';

describe('EnforcerDetailsComponent', () => {
  let component: EnforcerDetailsComponent;
  let fixture: ComponentFixture<EnforcerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnforcerDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnforcerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
