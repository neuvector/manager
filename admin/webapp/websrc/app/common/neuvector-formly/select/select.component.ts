import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { MatSelectChange } from '@angular/material/select';

@Component({
  standalone: false,
  selector: 'app-select',
  
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent extends FieldType<FieldTypeConfig> {
  change($event: MatSelectChange): void {
    this.to.change?.(this.field, $event);
  }
}
