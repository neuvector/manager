import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordPanelComponent } from './password-panel.component';

describe('PasswordPanelComponent', () => {
  let component: PasswordPanelComponent;
  let fixture: ComponentFixture<PasswordPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PasswordPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
