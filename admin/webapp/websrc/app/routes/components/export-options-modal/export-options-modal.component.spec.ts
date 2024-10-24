import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportOptionsModalComponent } from './export-options-modal.component';

describe('ExportOptionsModalComponent', () => {
  let component: ExportOptionsModalComponent;
  let fixture: ComponentFixture<ExportOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportOptionsModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportOptionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
