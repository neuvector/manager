import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestConnectionDialogTypeCellComponent } from './test-connection-dialog-type-cell.component';

describe('TestConnectionDialogTypeCellComponent', () => {
  let component: TestConnectionDialogTypeCellComponent;
  let fixture: ComponentFixture<TestConnectionDialogTypeCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestConnectionDialogTypeCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestConnectionDialogTypeCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
