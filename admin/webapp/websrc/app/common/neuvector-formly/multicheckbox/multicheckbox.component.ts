import { Component, ViewChildren, QueryList } from '@angular/core';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FieldType } from '@ngx-formly/material/form-field';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  standalone: false,
  selector: 'app-multicheckbox',
  templateUrl: './multicheckbox.component.html',
  styleUrls: ['./multicheckbox.component.scss'],
  
})
export class MulticheckboxComponent extends FieldType<FieldTypeConfig> {
  @ViewChildren(MatCheckbox) checkboxes!: QueryList<MatCheckbox>;

  onChange(value: any, checked: boolean) {
    this.formControl.markAsDirty();
    if (this.to.type === 'array') {
      this.formControl.patchValue(
        checked
          ? [...(this.formControl.value || []), value]
          : [...(this.formControl.value || [])].filter(o => o !== value)
      );
    } else {
      this.formControl.patchValue({
        ...this.formControl.value,
        [value]: checked,
      });
    }
    this.formControl.markAsTouched();
  }

  // TODO: find a solution to prevent scroll on focus
  override onContainerClick() {}

  isChecked(option: any) {
    const value = this.formControl.value;

    return (
      value &&
      (this.to.type === 'array'
        ? value.indexOf(option.value) !== -1
        : value[option.value])
    );
  }
}
