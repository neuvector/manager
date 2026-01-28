import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-events-grid-user-cell',
  templateUrl: './events-grid-user-cell.component.html',
  styleUrls: ['./events-grid-user-cell.component.scss'],
})
export class EventsGridUserCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  hashTable4UserDomainRole!: { [key: string]: string[] };
  userRoles!: string;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.hashTable4UserDomainRole = {};
    this.userRoles = this.renderUserRoles(
      this.params.data.user_roles || {}
    ).join(', ');
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  renderUserRoles(userRolesMap: Object) {
    let userRoles = [] as any;
    Object.entries(userRolesMap).forEach(([key, value]) => {
      if (!key && value) {
        userRoles.push(`${value}(Global)`);
      }
      if (key) {
        let entry = { key: value, value: key };
        this.put2hashTable(entry);
      }
    });
    Object.entries(this.hashTable4UserDomainRole).forEach(([key, value]) => {
      userRoles.push(`${key}(${value.join(',')})`);
    });
    return userRoles;
  }

  put2hashTable(entry) {
    if (!this.hashTable4UserDomainRole[entry.key]) {
      this.hashTable4UserDomainRole[entry.key] = [entry.value];
    } else {
      this.hashTable4UserDomainRole[entry.key].push(entry.value);
    }
  }
}
