import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamlFormComponent } from './saml-form.component';

describe('SamlFormComponent', () => {
  let component: SamlFormComponent;
  let fixture: ComponentFixture<SamlFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SamlFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SamlFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
