import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewProcessRuleModalComponent } from './review-process-rule-modal.component';

describe('ReviewProcessRuleModalComponent', () => {
  let component: ReviewProcessRuleModalComponent;
  let fixture: ComponentFixture<ReviewProcessRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReviewProcessRuleModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewProcessRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
