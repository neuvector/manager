import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupResponseRulesComponent } from './group-response-rules.component';

describe('GroupResponseRulesComponent', () => {
  let component: GroupResponseRulesComponent;
  let fixture: ComponentFixture<GroupResponseRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupResponseRulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupResponseRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
