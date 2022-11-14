import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FederatedConfigFormComponent } from './federated-config-form.component';

describe('FederatedConfigFormComponent', () => {
  let component: FederatedConfigFormComponent;
  let fixture: ComponentFixture<FederatedConfigFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FederatedConfigFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FederatedConfigFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
