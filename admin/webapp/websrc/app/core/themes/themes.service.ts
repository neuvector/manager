import { Injectable } from '@angular/core';

// const themeA = require('../../common/styles/themes/theme-a.scss');
// const themeB = require('../../common/styles/themes/theme-b.scss');

@Injectable()
export class ThemesService {
  styleTag: any;
  defaultTheme: string = 'A';

  constructor() {
    this.createStyle();
    this.setTheme(this.defaultTheme);
  }

  private createStyle() {
    const head = document.head || document.getElementsByTagName('head')[0];
    this.styleTag = document.createElement('style');
    this.styleTag.type = 'text/css';
    this.styleTag.id = 'appthemes';
    head.appendChild(this.styleTag);
  }

  setTheme(name) {
    // switch (name) {
    //   case 'A':
    //     this.injectStylesheet(themeA);
    //     break;
    //   case 'B':
    //     this.injectStylesheet(themeB);
    //     break;
    // }
  }

  injectStylesheet(css) {
    this.styleTag.innerHTML = css.default;
  }

  getDefaultTheme() {
    return this.defaultTheme;
  }
}
