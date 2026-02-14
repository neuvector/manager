import { Component, OnInit } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-readonly-wrapper',
  templateUrl: './readonly-wrapper.component.html',
  styleUrls: ['./readonly-wrapper.component.scss'],
})
export class ReadonlyWrapperComponent extends FieldWrapper {
  get template() {
    return this.to.readOnly.template(this.field);
  }

  get readOnly() {
    return this.model
      ? this.to.readOnly && (!this.model.isEditable || this.to.readOnly.always)
      : this.to.readOnly && this.to.readOnly.always;
  }
}
