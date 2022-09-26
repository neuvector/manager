import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-chips-input',
  templateUrl: './chips-input.component.html',
  styleUrls: ['./chips-input.component.scss'],
})
export class ChipsInputComponent extends FieldType<FieldTypeConfig> {
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  chips: string[] = [];

  add(event: MatChipInputEvent): void {
    const value = event.value;

    if ((value || '').trim()) {
      this.formControl.setValue([...this.formControl.value, value.trim()]);
      this.formControl.updateValueAndValidity();
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  remove(fruit: string): void {
    const index = this.formControl.value.indexOf(fruit);

    if (index >= 0) {
      this.formControl.value.splice(index, 1);
      this.formControl.updateValueAndValidity();
    }
  }
}
