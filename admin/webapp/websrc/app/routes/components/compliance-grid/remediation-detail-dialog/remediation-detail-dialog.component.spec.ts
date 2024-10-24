import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemediationDetailDialogComponent } from './remediation-detail-dialog.component';

describe('RemediationDetailDialogComponent', () => {
  let component: RemediationDetailDialogComponent;
  let fixture: ComponentFixture<RemediationDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RemediationDetailDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemediationDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
