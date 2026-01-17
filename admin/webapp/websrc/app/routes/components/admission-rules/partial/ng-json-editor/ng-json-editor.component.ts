import { Component } from '@angular/core';
import {
  AfterViewInit,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
} from '@angular/core';
import JSONEditor from 'jsoneditor';

@Component({
  selector: 'app-ng-json-editor',
  standalone: false,
  templateUrl: './ng-json-editor.component.html',
  styleUrl: './ng-json-editor.component.scss',
})
export class NgJsonEditorComponent implements AfterViewInit, OnDestroy {
  @Input() data: any;
  @Input() options: any;
  editor: any;

  constructor(private container: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.editor = new JSONEditor(this.container.nativeElement, this.options);
      this.editor.set(this.data);
    });
  }

  ngOnDestroy() {
    this.editor.destroy();
  }
}
