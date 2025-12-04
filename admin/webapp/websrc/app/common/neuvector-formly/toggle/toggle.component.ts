import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
  
})
export class ToggleComponent extends FieldType<FieldTypeConfig> {
  constructor(private tr: TranslateService) {
    super();
  }

  get tooltip() {
    return this.tr.instant(this.to.tooltip);
  }
}
