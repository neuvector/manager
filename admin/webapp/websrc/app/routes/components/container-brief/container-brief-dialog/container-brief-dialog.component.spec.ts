import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerBriefDialogComponent } from './container-brief-dialog.component';

describe('ContainerBriefDialogComponent', () => {
  let component: ContainerBriefDialogComponent;
  let fixture: ComponentFixture<ContainerBriefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContainerBriefDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerBriefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
