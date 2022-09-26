import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomCheckActionButtonComponent } from './custom-check-action-button.component';

describe('CustomCheckActionButtonComponent', () => {
  let component: CustomCheckActionButtonComponent;
  let fixture: ComponentFixture<CustomCheckActionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomCheckActionButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomCheckActionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
