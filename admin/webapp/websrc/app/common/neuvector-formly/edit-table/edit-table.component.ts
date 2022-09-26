import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import {
  FieldArrayType,
  FieldArrayTypeConfig,
  FormlyFieldConfig,
} from '@ngx-formly/core';

interface VisibleField {
  key: string;
  viewValue: string;
  flexWidth?: string;
}

@Component({
  selector: 'app-edit-table',
  templateUrl: './edit-table.component.html',
  styleUrls: ['./edit-table.component.scss'],
})
export class EditTableComponent
  extends FieldArrayType<FieldArrayTypeConfig>
  implements OnInit
{
  @ViewChild('editTable', { static: true }) table!: MatTable<any>;
  dataSource: MatTableDataSource<FormlyFieldConfig> = new MatTableDataSource();
  visibleFields!: VisibleField[];
  get displayColumns(): string[] {
    return this.visibleFields.map(vf => vf.key);
  }

  ngOnInit(): void {
    this.field.templateOptions.remove = this.remove.bind(this);
    this.field.templateOptions.add = this.add.bind(this);
    this.dataSource.data = this.field.fieldGroup!;
    this.visibleFields = this.getFields(this.field.fieldArray!);
  }

  getFields(fa: FormlyFieldConfig): VisibleField[] {
    const ret: VisibleField[] = [];
    fa.fieldGroup?.forEach(ffg => {
      ret.push({
        key: String(ffg.key),
        viewValue: ffg.templateOptions?.viewValue,
        flexWidth: ffg.templateOptions?.flexWidth,
      });
    });
    return ret;
  }

  remove(e?: any) {
    super.remove(e);
    this.table.renderRows();
  }

  add(e?: any) {
    super.add(e);
    this.table.renderRows();
  }
}
