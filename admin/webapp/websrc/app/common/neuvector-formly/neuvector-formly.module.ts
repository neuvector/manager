import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IconInputComponent } from './icon-input/icon-input.component';
import { FormlyMaterialModule } from '@ngx-formly/material';
import {
  certificateValidator,
  emailValidator,
  fedNameValidator,
  objNameValidator,
  portRangeValidator,
  repoFilterValidator,
  urlValidator,
  webhookUsernameValidator,
} from '@common/neuvector-formly/formlyValidators';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { ToggleComponent } from './toggle/toggle.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SliderComponent } from './slider/slider.component';
import { MatSliderModule } from '@angular/material/slider';
import { ChipsInputComponent } from './chips-input/chips-input.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MaskInputDirective } from '@common/directives/maskInput.directive';
import { FormlyErrorsComponent } from './formly-errors/formly-errors.component';
import { TextAreaComponent } from './text-area/text-area.component';
import { SelectComponent } from './select/select.component';
import { MatSelectModule } from '@angular/material/select';
import { RadioComponent } from './radio/radio.component';
import { MatRadioModule } from '@angular/material/radio';
import { SectionWrapperComponent } from './section-wrapper/section-wrapper.component';
import { MatDividerModule } from '@angular/material/divider';
import { EditTableComponent } from './edit-table/edit-table.component';
import { MatTableModule } from '@angular/material/table';
import { EditTableControlsComponent } from './edit-table-controls/edit-table-controls.component';
import { ReadonlyWrapperComponent } from './readonly-wrapper/readonly-wrapper.component';
import { HintWrapperComponent } from './hint-wrapper/hint-wrapper.component';
import { CheckboxComponent } from './checkbox/checkbox.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ButtonComponent } from './button/button.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgxSliderComponent } from './ngx-slider/ngx-slider.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InputDialogModule } from '@components/ui/input-dialog/input-dialog.module';
import { MulticheckboxComponent } from './multicheckbox/multicheckbox.component';
import { FormlySelectModule } from '@ngx-formly/core/select';
import { EditWebhookTableControlsComponent } from './edit-webhook-table-controls/edit-webhook-table-controls.component';
import { PanelWrapperComponent } from './panel-wrapper/panel-wrapper.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { CardComponent } from './card/card.component';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export enum FormlyValidators {
  REQUIRED = 'required',
  URL = 'invalidURL',
  ObjName = 'invalidObjName',
  FedName = 'invalidFedName',
  WebhookUserName = 'invalidWebhookUserName',
  PortRange = 'invalidPortRange',
  EmailFormat = 'invalidEmail',
  Certificate = 'invalidCertificate',
  RepositoryFilter = 'invalidRepositoryFilter',
}

export enum FormlyComponents {
  CHECKBOX = 'checkbox',
  MULTI_CHECKBOX = 'multicheckbox',
  BUTTON = 'button',
  ICON_INPUT = 'icon_input',
  TOGGLE = 'toggle',
  SLIDER = 'slider',
  NGX_SLIDER = 'ngx_slider',
  CHIP_INPUT = 'chip_input',
  TEXT_AREA = 'text_area',
  SELECT = 'custom_select',
  RADIO = 'custom_radio',
  EDIT_TABLE = 'edit_table',
  EDIT_TABLE_CONTROLS = 'edit_table_controls',
  EDIT_WEBHOOK_TABLE_CONTROLS = 'edit_webhook_table_controls',
  READONLY_WRAPPER = 'readonly',
  SECTION_WRAPPER = 'section',
  HINT_WRAPPER = 'hint_wrapper',
  PANEL_WRAPPER = 'panel_wrapper',
  CARD = 'card',
}

export enum CardSeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'Warning',
  ERROR = 'error',
}

@NgModule({
  declarations: [
    IconInputComponent,
    ToggleComponent,
    SelectComponent,
    RadioComponent,
    SectionWrapperComponent,
    EditTableComponent,
    EditTableControlsComponent,
    ReadonlyWrapperComponent,
    HintWrapperComponent,
    CheckboxComponent,
    ButtonComponent,
    SliderComponent,
    NgxSliderComponent,
    MulticheckboxComponent,
    EditWebhookTableControlsComponent,
    PanelWrapperComponent,
    CardComponent,
    ChipsInputComponent,
    FormlyErrorsComponent,
    TextAreaComponent,
    MaskInputDirective,
  ],
  imports: [
    FormlySelectModule,
    CommonModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatInputModule,
    TranslateModule.forChild(),
    MatIconModule,
    MatSliderModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatSelectModule,
    MatRadioModule,
    MatTableModule,
    MatTooltipModule,
    MatCardModule,
    ClipboardModule,
    NgxSliderModule,
    InputDialogModule,
    FormlyModule.forRoot({
      wrappers: [
        {
          name: FormlyComponents.SECTION_WRAPPER,
          component: SectionWrapperComponent,
        },
        {
          name: FormlyComponents.READONLY_WRAPPER,
          component: ReadonlyWrapperComponent,
        },
        {
          name: FormlyComponents.HINT_WRAPPER,
          component: HintWrapperComponent,
        },
        {
          name: FormlyComponents.PANEL_WRAPPER,
          component: PanelWrapperComponent,
        },
      ],
      validators: [
        { name: FormlyValidators.URL, validation: urlValidator },
        { name: FormlyValidators.ObjName, validation: objNameValidator },
        { name: FormlyValidators.FedName, validation: fedNameValidator },
        {
          name: FormlyValidators.WebhookUserName,
          validation: webhookUsernameValidator,
        },
        { name: FormlyValidators.PortRange, validation: portRangeValidator },
        { name: FormlyValidators.EmailFormat, validation: emailValidator },
        {
          name: FormlyValidators.Certificate,
          validation: certificateValidator,
        },
        {
          name: FormlyValidators.RepositoryFilter,
          validation: repoFilterValidator,
        },
      ],
      types: [
        {
          name: FormlyComponents.CHECKBOX,
          component: CheckboxComponent,
          wrappers: [],
        },
        {
          name: FormlyComponents.MULTI_CHECKBOX,
          component: MulticheckboxComponent,
          wrappers: [],
        },
        { name: FormlyComponents.BUTTON, component: ButtonComponent },
        { name: FormlyComponents.ICON_INPUT, component: IconInputComponent },
        { name: FormlyComponents.TOGGLE, component: ToggleComponent },
        { name: FormlyComponents.SLIDER, component: SliderComponent },
        { name: FormlyComponents.NGX_SLIDER, component: NgxSliderComponent },
        { name: FormlyComponents.CHIP_INPUT, component: ChipsInputComponent },
        { name: FormlyComponents.TEXT_AREA, component: TextAreaComponent },
        { name: FormlyComponents.SELECT, component: SelectComponent },
        { name: FormlyComponents.RADIO, component: RadioComponent },
        { name: FormlyComponents.EDIT_TABLE, component: EditTableComponent },
        {
          name: FormlyComponents.EDIT_TABLE_CONTROLS,
          component: EditTableControlsComponent,
        },
        {
          name: FormlyComponents.EDIT_WEBHOOK_TABLE_CONTROLS,
          component: EditWebhookTableControlsComponent,
        },
        {
          name: FormlyComponents.CARD,
          component: CardComponent,
        },
      ],
    }),
    MatExpansionModule,
  ],
  exports: [FormlyModule, ReactiveFormsModule, FormlyMaterialModule],
})
export class NeuVectorFormlyModule {}
