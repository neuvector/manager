import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDomainRoleDialogComponent } from './group-domain-role-dialog.component';

describe('GroupDomainRoleDialogComponent', () => {
  let component: GroupDomainRoleDialogComponent;
  let fixture: ComponentFixture<GroupDomainRoleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupDomainRoleDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDomainRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
