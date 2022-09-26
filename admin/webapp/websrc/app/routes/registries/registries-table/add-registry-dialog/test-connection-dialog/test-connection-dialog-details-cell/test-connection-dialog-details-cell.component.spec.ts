import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestConnectionDialogDetailsCellComponent } from './test-connection-dialog-details-cell.component';

describe('TestConnectionDialogDetailsCellComponent', () => {
  let component: TestConnectionDialogDetailsCellComponent;
  let fixture: ComponentFixture<TestConnectionDialogDetailsCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestConnectionDialogDetailsCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestConnectionDialogDetailsCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
