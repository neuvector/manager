import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodBriefDialogComponent } from './pod-brief-dialog.component';

describe('PodBriefDialogComponent', () => {
  let component: PodBriefDialogComponent;
  let fixture: ComponentFixture<PodBriefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PodBriefDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodBriefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
