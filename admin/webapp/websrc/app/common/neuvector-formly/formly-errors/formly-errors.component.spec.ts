import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormlyErrorsComponent } from './formly-errors.component';

describe('FormlyErrorsComponent', () => {
  let component: FormlyErrorsComponent;
  let fixture: ComponentFixture<FormlyErrorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormlyErrorsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormlyErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
