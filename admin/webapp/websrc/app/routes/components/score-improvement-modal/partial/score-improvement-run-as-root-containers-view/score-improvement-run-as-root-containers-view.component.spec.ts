import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementRunAsRootContainersViewComponent } from './score-improvement-run-as-root-containers-view.component';

describe('ScoreImprovementRunAsRootContainersViewComponent', () => {
  let component: ScoreImprovementRunAsRootContainersViewComponent;
  let fixture: ComponentFixture<ScoreImprovementRunAsRootContainersViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreImprovementRunAsRootContainersViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementRunAsRootContainersViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
