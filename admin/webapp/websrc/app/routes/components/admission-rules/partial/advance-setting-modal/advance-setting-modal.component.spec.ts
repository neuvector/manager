import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceSettingModalComponent } from './advance-setting-modal.component';

describe('AdvanceSettingModalComponent', () => {
  let component: AdvanceSettingModalComponent;
  let fixture: ComponentFixture<AdvanceSettingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdvanceSettingModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvanceSettingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
