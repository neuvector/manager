import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfGenerationDialogComponent } from './pdf-generation-dialog.component';

describe('PdfGenerationDialogComponent', () => {
  let component: PdfGenerationDialogComponent;
  let fixture: ComponentFixture<PdfGenerationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdfGenerationDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfGenerationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
