import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNetworkRulesComponent } from './group-network-rules.component';

describe('GroupNetworkRulesComponent', () => {
  let component: GroupNetworkRulesComponent;
  let fixture: ComponentFixture<GroupNetworkRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupNetworkRulesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNetworkRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
