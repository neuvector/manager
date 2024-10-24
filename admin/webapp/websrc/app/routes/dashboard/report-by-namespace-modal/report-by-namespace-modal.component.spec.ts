import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportByNamespaceModalComponent } from './report-by-namespace-modal.component';

describe('ReportByNamespaceModalComponent', () => {
  let component: ReportByNamespaceModalComponent;
  let fixture: ComponentFixture<ReportByNamespaceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportByNamespaceModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportByNamespaceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
