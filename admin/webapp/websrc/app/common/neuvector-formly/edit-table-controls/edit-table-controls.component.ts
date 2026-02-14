import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-edit-table-controls',
  templateUrl: './edit-table-controls.component.html',
  styleUrls: ['./edit-table-controls.component.scss'],
})
export class EditTableControlsComponent
  extends FieldType<FieldTypeConfig>
  implements OnInit
{
  cache: any;
  get isEditable(): FormControl {
    return <FormControl>this.form.get('isEditable');
  }

  ngOnInit(): void {
    this.cache = {};
  }

  edit(): void {
    this.cache = this.form.value;
    this.toggleEdit();
  }

  toggleEdit(): void {
    if (!this.isEditable.value) {
      this.isEditable.setValue(true);
    } else {
      this.isEditable.setValue(false);
    }
  }

  delete(): void {
    const _i = this.field.parent?.key;
    this.field.parent?.parent?.templateOptions?.remove(_i);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.toggleEdit();
      this.cache = {};
    }
  }

  cancel(): void {
    if (Object.keys(this.cache).length === 0) {
      this.delete();
    } else {
      this.form.patchValue(this.cache);
      this.cache = {};
    }
  }
}
