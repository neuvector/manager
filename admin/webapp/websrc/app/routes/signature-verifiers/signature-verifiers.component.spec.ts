import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignatureVerifiersComponent } from './signature-verifiers.component';

describe('SignatureVerifiersComponent', () => {
  let component: SignatureVerifiersComponent;
  let fixture: ComponentFixture<SignatureVerifiersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignatureVerifiersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignatureVerifiersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
