import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportAdmissionRulesModalComponent } from './export-admission-rules-modal.component';

describe('ExportAdmissionRulesModalComponent', () => {
  let component: ExportAdmissionRulesModalComponent;
  let fixture: ComponentFixture<ExportAdmissionRulesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportAdmissionRulesModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportAdmissionRulesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
