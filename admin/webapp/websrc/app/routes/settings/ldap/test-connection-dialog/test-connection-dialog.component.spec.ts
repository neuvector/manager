import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestConnectionDialogComponent } from './test-connection-dialog.component';

describe('TestConnectionDialogComponent', () => {
  let component: TestConnectionDialogComponent;
  let fixture: ComponentFixture<TestConnectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestConnectionDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestConnectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
