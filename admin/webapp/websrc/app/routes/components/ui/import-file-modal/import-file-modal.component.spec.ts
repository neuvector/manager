import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportFileModalComponent } from './import-file-modal.component';

describe('ImportFileModalComponent', () => {
  let component: ImportFileModalComponent;
  let fixture: ComponentFixture<ImportFileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImportFileModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportFileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
