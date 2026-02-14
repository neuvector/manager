import { Component, OnInit } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-hint-wrapper',
  templateUrl: './hint-wrapper.component.html',
  styleUrls: ['./hint-wrapper.component.scss'],
})
export class HintWrapperComponent extends FieldWrapper {}
