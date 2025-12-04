import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { GroupMappedRole, MappableRoles } from '@common/types';
import { MatDialog } from '@angular/material/dialog';
import {
  GroupDomainRoleDialogComponent,
  GroupDomainRoleDialogData,
} from './group-domain-role-dialog/group-domain-role-dialog.component';
import { filter } from 'rxjs/operators';


@Component({
  standalone: false,
  selector: 'app-group-domain-role',
  templateUrl: './group-domain-role.component.html',
  styleUrls: ['./group-domain-role.component.scss'],
  
})
export class GroupDomainRoleComponent {
  @Output() updateGroupMappedRoles: EventEmitter<GroupMappedRole[]> =
    new EventEmitter<GroupMappedRole[]>();
  @Input() mappableRoles!: MappableRoles;
  @Input() groupMappedRoles!: GroupMappedRole[];
  @Input() domains!: string[];
  @Input() isReadOnly!: boolean;

  @ViewChild('table') table!: MatTable<GroupMappedRole>;
  displayedColumns: string[] = [
    'position',
    'group',
    'globalRole',
    'namespaceRoles',
    'controls',
  ];

  constructor(private dialog: MatDialog) {}

  dropTable(event: CdkDragDrop<GroupMappedRole[]>): void {
    const prevIndex = this.groupMappedRoles.findIndex(
      d => d === event.item.data
    );
    moveItemInArray(this.groupMappedRoles, prevIndex, event.currentIndex);
    this.table.renderRows();
    this.updateGroupMappedRoles.emit(this.groupMappedRoles);
  }

  openDialog(groupMappedRole?: GroupMappedRole): void {
    let data: GroupDomainRoleDialogData;
    let dataSource: MatTableDataSource<any>;
    let role_idx = -1;
    if (groupMappedRole) {
      role_idx = this.groupMappedRoles.findIndex(
        role => role.group === groupMappedRole.group
      );
      groupMappedRole.role_domains = groupMappedRole.role_domains || {};
      dataSource = new MatTableDataSource(
        this.mappableRoles.group_domain_roles
          .filter(role => role)
          .map(role => {
            return {
              namespaceRole: role,
              namespaces: groupMappedRole.role_domains[role]
                ? [...groupMappedRole.role_domains[role]]
                : [],
            };
          })
      );
      data = {
        isEdit: true,
        global_role: groupMappedRole.global_role,
        group: groupMappedRole.group,
        group_roles: [...this.mappableRoles.group_roles],
        group_domain_roles: [...this.mappableRoles.group_domain_roles],
        dataSource,
        domains: [...this.domains],
      };
    } else {
      dataSource = new MatTableDataSource<{
        namespaceRole: string;
        namespaces: string[];
      }>(
        this.mappableRoles.group_domain_roles
          .filter(role => role)
          .map(role => {
            return { namespaceRole: role, namespaces: [] };
          })
      );
      data = {
        isEdit: false,
        global_role: '',
        group: '',
        group_roles: [...this.mappableRoles.group_roles],
        group_domain_roles: [...this.mappableRoles.group_domain_roles],
        dataSource,
        domains: [...this.domains],
      };
    }
    const dialogRef = this.dialog.open(GroupDomainRoleDialogComponent, {
      width: '100%',
      data,
    });

    dialogRef
      .afterClosed()
      .pipe(filter(result => result))
      .subscribe((result: GroupDomainRoleDialogData) => {
        const roleDomains = result.dataSource.data
          .filter(({ namespaces }) => namespaces.length)
          .reduce((acc, role) => {
            const { namespaceRole, namespaces } = role;
            return { ...acc, [namespaceRole]: [...namespaces] };
          }, {});
        const newRole: GroupMappedRole = {
          global_role: result.global_role,
          group: result.group,
          role_domains: roleDomains,
        };
        if (groupMappedRole && role_idx !== -1) {
          this.groupMappedRoles = this.groupMappedRoles.map((role, idx) =>
            idx === role_idx ? newRole : role
          );
        } else {
          this.groupMappedRoles = [newRole, ...this.groupMappedRoles];
        }
        this.updateGroupMappedRoles.emit(this.groupMappedRoles);
      });
  }

  removeRole(groupMappedRole: GroupMappedRole): void {
    this.groupMappedRoles = this.groupMappedRoles.filter(
      role => role !== groupMappedRole
    );
    this.updateGroupMappedRoles.emit(this.groupMappedRoles);
  }
}
