import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementRunAsPrivilegedContainersViewComponent } from './score-improvement-run-as-privileged-containers-view.component';

describe('ScoreImprovementRunAsPrivilegedContainersViewComponent', () => {
  let component: ScoreImprovementRunAsPrivilegedContainersViewComponent;
  let fixture: ComponentFixture<ScoreImprovementRunAsPrivilegedContainersViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScoreImprovementRunAsPrivilegedContainersViewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ScoreImprovementRunAsPrivilegedContainersViewComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
