import { Injectable } from '@angular/core';

@Injectable()
export class SwitchersService {
  private user: any;
  private readonly app: any;
  private readonly layout: any;

  constructor() {
    this.app = {
      name: 'NeuVector',
      description: 'NeuVector Security Console',
      year: new Date().getFullYear(),
    };

    this.layout = {
      isFixed: true,
      isCollapsed: false,
      isBoxed: false,
      isRTL: false,
      horizontal: false,
      isFloat: false,
      leftSideHover: false,
      theme: null,
      leftSideScrollbar: false,
      isCollapsedText: false,
      useFullLayout: false,
      hiddenFooter: false,
      offsidebarOpen: false,
      leftSideToggled: false,
      viewAnimation: 'ng-fadeInUp',
    };
  }

  getAppSwitcher(name) {
    return name ? this.app[name] : this.app;
  }

  setAppSwitcher(name, value) {
    if (typeof this.app[name] !== 'undefined') {
      this.app[name] = value;
    }
  }

  setFrameSwitcher(name, value) {
    if (typeof this.layout[name] !== 'undefined') {
      return (this.layout[name] = value);
    }
  }

  getFrameSwitcher(name) {
    return name ? this.layout[name] : this.layout;
  }

  toggleFrameSwitcher(name) {
    return this.setFrameSwitcher(name, !this.getFrameSwitcher(name));
  }
}
