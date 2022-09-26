import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredefinedFileAccessRulesModalComponent } from './predefined-file-access-rules-modal.component';

describe('PredefinedFileAccessRulesModalComponent', () => {
  let component: PredefinedFileAccessRulesModalComponent;
  let fixture: ComponentFixture<PredefinedFileAccessRulesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PredefinedFileAccessRulesModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PredefinedFileAccessRulesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
