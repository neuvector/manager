import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { ControlContainer } from '@angular/forms';

@Directive({
  selector: '[appMaskInput]',
  standalone: false,
})
export class MaskInputDirective implements OnInit {
  @Input() maskOnBlur = false;
  private value: any;
  private element: HTMLInputElement;

  constructor(
    private el: ElementRef,
    private form: ControlContainer
  ) {
    this.element = el.nativeElement;
  }

  ngOnInit(): void {
    if (this.maskOnBlur) {
      this.value = this.element.value;
      this.formatValue();
    }
  }

  @HostListener('input') onChange(): void {
    if (this.maskOnBlur) {
      this.value = this.element.value;
    }
  }

  @HostListener('blur') onBlur(): void {
    if (this.maskOnBlur) {
      this.formatValue();
    }
  }

  @HostListener('focus') onFocus(): void {
    if (this.maskOnBlur) {
      this.element.value = this.value;
    }
  }

  formatValue(): void {
    if (this.element.value) {
      this.element.value = '**************';
    }
  }
}
