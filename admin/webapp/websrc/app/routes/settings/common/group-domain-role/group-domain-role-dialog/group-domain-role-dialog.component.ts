import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GroupDomainRoleComponent } from '../group-domain-role.component';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

export interface GroupDomainRoleDialogData {
  isEdit: boolean;
  global_role: string;
  group: string;
  group_roles: string[];
  group_domain_roles: string[];
  dataSource: MatTableDataSource<any>;
  domains: string[];
}

@Component({
  standalone: false,
  selector: 'app-group-domain-role-dialog-contents',
  templateUrl: './group-domain-role-dialog.component.html',
  styleUrls: ['./group-domain-role-dialog.component.scss'],
})
export class GroupDomainRoleDialogComponent {
  activeRole = this.data.dataSource.data[0].namespaceRole;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  namespaceCtrl = new FormControl();
  filteredDomains!: Observable<string[]>;
  domainChips: string[] = [];

  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public dialogRef: MatDialogRef<GroupDomainRoleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupDomainRoleDialogData,
    private cd: ChangeDetectorRef
  ) {}

  updateTable() {
    this.cd.detectChanges();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
