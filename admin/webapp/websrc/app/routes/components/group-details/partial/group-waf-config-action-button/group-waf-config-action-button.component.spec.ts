import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupWafConfigActionButtonComponent } from './group-waf-config-action-button.component';

describe('GroupWafConfigActionButtonComponent', () => {
  let component: GroupWafConfigActionButtonComponent;
  let fixture: ComponentFixture<GroupWafConfigActionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupWafConfigActionButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupWafConfigActionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
