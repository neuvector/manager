import { Component, OnInit } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Options } from '@angular-slider/ngx-slider';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-ngx-slider',
  templateUrl: './ngx-slider.component.html',
  styleUrls: ['./ngx-slider.component.scss'],
  
})
export class NgxSliderComponent
  extends FieldType<FieldTypeConfig>
  implements OnInit
{
  sliderOptions!: Options;

  constructor(private tr: TranslateService) {
    super();
  }

  ngOnInit(): void {
    this.sliderOptions = {
      floor: this.to.min,
      ceil: this.to.max,
      step: this.to.step,
      showTicks: this.to.showTicks,
      tickStep: this.to.tickStep,
      ticksArray: this.to.ticksArray,
      translate: this.to.formatter,
      disabled: this.to.disabled,
      ariaLabel: this.to.label ? this.tr.instant(this.to.label) : 'ngx-slider',
    };
    this.to.onChangeDisabled = this.onChangeDisabled.bind(this);
  }

  onChangeDisabled(disabled: boolean) {
    this.sliderOptions = Object.assign({}, this.sliderOptions, {
      disabled: disabled,
    });
  }
}
