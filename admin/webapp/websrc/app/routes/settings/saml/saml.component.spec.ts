import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamlComponent } from './saml.component';

describe('SamlComponent', () => {
  let component: SamlComponent;
  let fixture: ComponentFixture<SamlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SamlComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SamlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
