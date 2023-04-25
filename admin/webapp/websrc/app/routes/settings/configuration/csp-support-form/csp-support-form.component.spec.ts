import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CspSupportFormComponent } from './csp-support-form.component';

describe('CspSupportFormComponent', () => {
  let component: CspSupportFormComponent;
  let fixture: ComponentFixture<CspSupportFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CspSupportFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CspSupportFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
