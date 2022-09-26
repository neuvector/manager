import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewNetworkRuleModalComponent } from './review-network-rule-modal.component';

describe('ReviewNetworkRuleModalComponent', () => {
  let component: ReviewNetworkRuleModalComponent;
  let fixture: ComponentFixture<ReviewNetworkRuleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReviewNetworkRuleModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewNetworkRuleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
