import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupWafComponent } from './group-waf.component';

describe('GroupWafComponent', () => {
  let component: GroupWafComponent;
  let fixture: ComponentFixture<GroupWafComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupWafComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupWafComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
