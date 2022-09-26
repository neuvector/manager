import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FederatedPolicyComponent } from './federated-policy.component';

describe('FederatedPolicyComponent', () => {
  let component: FederatedPolicyComponent;
  let fixture: ComponentFixture<FederatedPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FederatedPolicyComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FederatedPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
