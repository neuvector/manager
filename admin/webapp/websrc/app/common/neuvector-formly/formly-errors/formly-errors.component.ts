import { Component, Input } from '@angular/core';
import { FieldTypeConfig } from '@ngx-formly/core';
import { FormlyValidators } from '@common/neuvector-formly/neuvector-formly.module';

@Component({
  standalone: false,
  selector: 'app-formly-errors',

  templateUrl: './formly-errors.component.html',
  styleUrls: ['./formly-errors.component.scss'],
})
export class FormlyErrorsComponent {
  formlyValidators = FormlyValidators;
  @Input() field!: FieldTypeConfig;
}
