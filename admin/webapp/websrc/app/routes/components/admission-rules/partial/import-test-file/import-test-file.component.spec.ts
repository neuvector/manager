import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTestFileComponent } from './import-test-file.component';

describe('ImportFileComponent', () => {
  let component: ImportTestFileComponent;
  let fixture: ComponentFixture<ImportTestFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportTestFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportTestFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
