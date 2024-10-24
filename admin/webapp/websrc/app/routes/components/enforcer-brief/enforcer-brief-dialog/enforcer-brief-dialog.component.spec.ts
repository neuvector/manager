import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnforcerBriefDialogComponent } from './enforcer-brief-dialog.component';

describe('EnforcerBriefDialogComponent', () => {
  let component: EnforcerBriefDialogComponent;
  let fixture: ComponentFixture<EnforcerBriefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnforcerBriefDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnforcerBriefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
