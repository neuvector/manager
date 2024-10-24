import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchModeModalComponent } from './switch-mode-modal.component';

describe('SwitchModeModalComponent', () => {
  let component: SwitchModeModalComponent;
  let fixture: ComponentFixture<SwitchModeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SwitchModeModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchModeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
