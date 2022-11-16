import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FederatedPolicyConfigurationComponent } from './federated-policy-configuration.component';

describe('FederatedPolicyConfigurationComponent', () => {
  let component: FederatedPolicyConfigurationComponent;
  let fixture: ComponentFixture<FederatedPolicyConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FederatedPolicyConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FederatedPolicyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
