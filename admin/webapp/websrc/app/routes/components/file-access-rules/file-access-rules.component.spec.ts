import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileAccessRulesComponent } from './file-access-rules.component';

describe('FileAccessRulesComponent', () => {
  let component: FileAccessRulesComponent;
  let fixture: ComponentFixture<FileAccessRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileAccessRulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileAccessRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
