import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementGeneralListItemComponent } from './score-improvement-general-list-item.component';

describe('ScoreImprovementGeneralListItemComponent', () => {
  let component: ScoreImprovementGeneralListItemComponent;
  let fixture: ComponentFixture<ScoreImprovementGeneralListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreImprovementGeneralListItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementGeneralListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
