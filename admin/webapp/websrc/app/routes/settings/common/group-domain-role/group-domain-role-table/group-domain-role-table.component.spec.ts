import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDomainRoleTableComponent } from './group-domain-role-table.component';

describe('GroupDomainRoleTableComponent', () => {
  let component: GroupDomainRoleTableComponent;
  let fixture: ComponentFixture<GroupDomainRoleTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupDomainRoleTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDomainRoleTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
