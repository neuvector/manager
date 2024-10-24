import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignatureActionButtonsComponent } from './signature-action-buttons.component';

describe('SignatureActionButtonsComponent', () => {
  let component: SignatureActionButtonsComponent;
  let fixture: ComponentFixture<SignatureActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignatureActionButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignatureActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
