import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestSettingsDialogComponent } from './test-settings-dialog.component';

describe('TestConnectionDialogComponent', () => {
  let component: TestSettingsDialogComponent;
  let fixture: ComponentFixture<TestSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestSettingsDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
