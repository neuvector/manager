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
  standalone: false,
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
    if (!this.field.props) {
        this.field.props = {};
    }
    
    this.field.props.remove = this.remove.bind(this);
    this.field.props.add = this.add.bind(this);
    
    this.dataSource.data = this.field.fieldGroup!;
    const fieldArray = typeof this.field.fieldArray === 'function' ? this.field.fieldArray(this.field) : this.field.fieldArray!;
    this.visibleFields = this.getFields(fieldArray);
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
