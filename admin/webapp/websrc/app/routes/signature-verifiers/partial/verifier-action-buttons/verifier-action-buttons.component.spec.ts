import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifierActionButtonsComponent } from './verifier-action-buttons.component';

describe('VerifierActionButtonsComponent', () => {
  let component: VerifierActionButtonsComponent;
  let fixture: ComponentFixture<VerifierActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerifierActionButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifierActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
