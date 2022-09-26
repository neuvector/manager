import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskScoreComponent } from './risk-score.component';

describe('RiskScoreComponent', () => {
  let component: RiskScoreComponent;
  let fixture: ComponentFixture<RiskScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskScoreComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
