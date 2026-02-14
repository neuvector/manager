import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

export declare type LoadingButtonType =
  | 'mat-button'
  | 'mat-raised-button'
  | 'mat-stroked-button'
  | 'mat-flat-button'
  | 'mat-icon-button'
  | 'mat-fab'
  | 'mat-mini-fab';

@Component({
  standalone: false,
  selector: 'app-loading-button',
  templateUrl: './loading-button.component.html',
  styleUrls: ['./loading-button.component.scss'],
})
export class LoadingButtonComponent {
  @Input() id!: string;
  @Input() disabled!: boolean;
  @Input() loading!: boolean;
  @Input() color!: ThemePalette;
  @Input() text!: string;
  @Input() appearance!: LoadingButtonType;
  @Input() type!: string;
  @Input() iconClasses!: string;
  @Input() iconName!: string;
  @Input() ariaLabel!: string;
  @Input() buttonClasses!: string;
  @Output() btnClick = new EventEmitter();

  onClick(event): void {
    this.btnClick.emit(event);
  }
}
