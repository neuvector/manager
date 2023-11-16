import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchedRuleListComponent } from './matched-rule-list.component';

describe('MatchedRuleListComponent', () => {
  let component: MatchedRuleListComponent;
  let fixture: ComponentFixture<MatchedRuleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatchedRuleListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatchedRuleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
