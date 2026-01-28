import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import {
  MatAutocompleteActivatedEvent,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatChipInputEvent } from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { map } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-group-domain-role-table',
  templateUrl: './group-domain-role-table.component.html',
  styleUrls: ['./group-domain-role-table.component.scss'],
})
export class GroupDomainRoleTableComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input() activeRole!: string;
  @Input() dataSource!: MatTableDataSource<any>;
  @Input() domains!: string[];
  @Input() global_role!: string;
  @Input() group_roles!: string[];
  @Input() isReadOnly: boolean = false;
  displayedColumns = ['namespaceRoles', 'namespaces'];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  namespaceCtrl = new FormControl();
  filteredDomains!: Observable<string[]>;
  domainChips: string[] = [];
  autocompleteTagsOptionActivated = false;
  dirty: boolean = false;

  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private liveAnnouncer: LiveAnnouncer,
    private cd: ChangeDetectorRef
  ) {
    this.filteredDomains = this.namespaceCtrl.valueChanges.pipe(
      map((domain: string) => {
        return domain ? this._filter(domain) : [];
      })
    );
  }

  announceSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnInit(): void {
    this.updateTable();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.global_role) {
      this.updateTable();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  clickRow(newActiveRole: string): void {
    this.activeRole = newActiveRole;
    this.setChips();
  }

  optionActivated(event: MatAutocompleteActivatedEvent): void {
    if (event.option) {
      this.autocompleteTagsOptionActivated = true;
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.namespaceInput.nativeElement.value = '';
    if (this.domainChips.includes(event.option.viewValue)) {
      return;
    }
    this.domainChips.push(event.option.value);
    this.autocompleteTagsOptionActivated = false;
    this.namespaceCtrl.setValue(null);
    this.addToTable(event.option.value);
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (
      !this.autocompleteTagsOptionActivated &&
      value &&
      !this.domainChips.includes(value)
    ) {
      this.domainChips.push(value);
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
    this.namespaceCtrl.setValue(null);
    this.addToTable(value);
  }

  remove(domain: string): void {
    const chipIdx = this.domainChips.indexOf(domain);
    if (chipIdx >= 0) {
      this.domainChips.splice(chipIdx, 1);
    }
    const row = this.findRowFromRole(this.activeRole);
    if (row) {
      const rowIdx = this.dataSource.data.indexOf(row);
      const namespaceIdx =
        this.dataSource.data[rowIdx].namespaces.indexOf(domain);
      if (namespaceIdx >= 0) {
        this.dataSource.data[rowIdx].namespaces.splice(namespaceIdx, 1);
      }
    }
    this.dirty = true;
  }

  addToTable(value: any): void {
    const row = this.findRowFromRole(this.activeRole);
    if (row && value) {
      const rowIndex = this.dataSource.data.indexOf(row);
      if (!this.dataSource.data[rowIndex].namespaces.includes(value)) {
        this.dataSource.data[rowIndex].namespaces.push(value);
      }
    }
    this.dirty = true;
  }

  updateTable(): void {
    if (this.global_role === 'admin') {
      this.dataSource.data = this.dataSource.data.filter(
        ({ namespaceRole }) => namespaceRole !== 'admin'
      );
      this.dataSource.data[0].namespaces = [];
      this.domainChips = [];
      return;
    }
    this.dataSource.data = this.dataSource.data.filter(
      ({ namespaceRole }) => namespaceRole !== this.global_role
    );
    this.group_roles.forEach((role: string) => {
      if (role && !this.findRowFromRole(role) && role !== this.global_role) {
        this.dataSource.data = [
          ...this.dataSource.data,
          { namespaceRole: role, namespaces: [] },
        ];
      }
    });
    this.activeRole = this.dataSource.data[0].namespaceRole;
    this.setChips();
    this.cd.detectChanges();
    this.dataSource.sort = this.sort;
  }

  private setChips(): void {
    const row = this.findRowFromRole(this.activeRole);
    if (row) {
      const rowIndex = this.dataSource.data.indexOf(row);
      this.domainChips = [...this.dataSource.data[rowIndex].namespaces];
    }
  }

  private findRowFromRole(
    role: string
  ): { namespaceRole: string; namespaces: string[] } | undefined {
    return this.dataSource.data.find(
      ({ namespaceRole }) => namespaceRole === role
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.domains
      .filter(domain => !this.domainChips.includes(domain))
      .filter(domain => domain.toLowerCase().includes(filterValue));
  }
}
