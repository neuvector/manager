import { Injectable } from '@angular/core';


@Injectable()
export class ThemesService {
  styleTag: any;
  defaultTheme: string = 'A';

  constructor() {
    this.createStyle();
  }

  private createStyle() {
    const head = document.head || document.getElementsByTagName('head')[0];
    this.styleTag = document.createElement('style');
    this.styleTag.type = 'text/css';
    this.styleTag.id = 'appthemes';
    head.appendChild(this.styleTag);
  }
  
  injectStylesheet(css) {
    this.styleTag.innerHTML = css.default;
  }

  getDefaultTheme() {
    return this.defaultTheme;
  }
}
