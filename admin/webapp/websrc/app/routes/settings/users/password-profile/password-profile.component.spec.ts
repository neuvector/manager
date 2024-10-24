import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordProfileComponent } from './password-profile.component';

describe('PasswordProfileComponent', () => {
  let component: PasswordProfileComponent;
  let fixture: ComponentFixture<PasswordProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PasswordProfileComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
