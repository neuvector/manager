import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDomainRoleComponent } from './group-domain-role.component';

describe('GroupDomainRoleComponent', () => {
  let component: GroupDomainRoleComponent;
  let fixture: ComponentFixture<GroupDomainRoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupDomainRoleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDomainRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
