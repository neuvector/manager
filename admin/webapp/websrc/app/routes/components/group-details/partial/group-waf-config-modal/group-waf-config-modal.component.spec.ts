import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupWafConfigModalComponent } from './group-waf-config-modal.component';

describe('GroupWafConfigModalComponent', () => {
  let component: GroupWafConfigModalComponent;
  let fixture: ComponentFixture<GroupWafConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupWafConfigModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupWafConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
