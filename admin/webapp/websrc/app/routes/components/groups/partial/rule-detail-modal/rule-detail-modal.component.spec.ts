import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleDetailModalComponent } from './rule-detail-modal.component';

describe('RuleDetailModalComponent', () => {
  let component: RuleDetailModalComponent;
  let fixture: ComponentFixture<RuleDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RuleDetailModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
