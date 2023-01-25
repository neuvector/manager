import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessProfileRuleNameHeaderComponent } from './process-profile-rule-name-header.component';

describe('ProcessProfileRuleNameHeaderComponent', () => {
  let component: ProcessProfileRuleNameHeaderComponent;
  let fixture: ComponentFixture<ProcessProfileRuleNameHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcessProfileRuleNameHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessProfileRuleNameHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
