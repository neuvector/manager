import { Component, OnInit, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
declare var $: any;

import { MenuService } from '@core/menu/menu.service';
import { SwitchersService } from '@core/switchers/switchers.service';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  
})
export class SidebarComponent implements OnInit, OnDestroy {
  menuItems: Array<any>;
  router: Router = <Router>{};
  menuClickEvent = 'click.sidebar-toggle';
  $doc: any = null;
  customHeaderStyle;
  customFooterStyle;
  customSideBarStyle;

  constructor(
    public menu: MenuService,
    public switchers: SwitchersService,
    public injector: Injector
  ) {
    this.menuItems = menu.getMenu();
  }

  ngOnInit() {
    this.router = this.injector.get(Router);
    if (
      !GlobalVariable.summary?.platform
        .toLowerCase()
        .includes(GlobalConstant.KUBE)
    ) {
      this.menuItems = this.removeSubMenu(
        this.menuItems,
        'assets',
        'namespaces'
      );
    }

    this.router.events.subscribe(() => {
      this.removeFloatingNav();
      window.scrollTo(0, 0);
      this.switchers.setFrameSwitcher('leftSideToggled', false);
    });

    this.$doc = $(document).on(this.menuClickEvent, e => {
      if (!$(e.target).parents('.left-side-container').length) {
        this.switchers.setFrameSwitcher('leftSideToggled', false);
      }
    });

    if (GlobalVariable.customPageHeaderColor) {
      this.customHeaderStyle = {
        'margin-top': '28px',
      };
      this.customSideBarStyle = {
        height: 'calc(100vh - 268px)',
      };
      this.customFooterStyle = {
        bottom: '28px',
      };
    }
  }

  ngOnDestroy() {
    if (this.$doc) this.$doc.off(this.menuClickEvent);
  }

  toggleSubmenuClick(event, dropdownId = '') {
    event.preventDefault();
    $('.menu-arrow').each((idx, el) => {
      el.innerText = 'arrow_drop_down';
    });

    if (
      !this.isSidebarCollapsed() &&
      !this.isSidebarCollapsedText() &&
      !this.isEnabledHover()
    ) {
      let ul = $(event.currentTarget.nextElementSibling);

      let parentNav = ul.parents('.sidebar-subnav');
      $('.sidebar-subnav').each((idx, el) => {
        let $el = $(el);
        if (el !== parentNav[0] && el !== ul[0]) {
          this.closeMenu($el);
          if (dropdownId !== '') {
            $(`#${dropdownId}`)[0].innerText = 'arrow_drop_down';
          }
        }
      });

      if (!ul.length) {
        return;
      }

      ul.find('.sidebar-subnav').each((idx, el) => {
        this.closeMenu($(el));
        if (dropdownId !== '') {
          $(`#${dropdownId}`)[0].innerText = 'arrow_drop_down';
        }
      });

      const ulHeight = ul.css('height');
      if (ulHeight === 'auto' || parseInt(ulHeight, 10)) {
        this.closeMenu(ul);
        if (dropdownId !== '') {
          $(`#${dropdownId}`)[0].innerText = 'arrow_drop_down';
        }
      } else {
        ul.on('transitionend', () => {
          ul.css('height', 'auto').off('transitionend');
        }).css('height', ul[0].scrollHeight);
        ul.addClass('opening');
        if (dropdownId !== '') {
          $(`#${dropdownId}`)[0].innerText = 'arrow_drop_up';
        }
      }
    }
  }

  closeMenu(elem) {
    elem.css('height', elem[0].scrollHeight);
    elem.css('height', 0);
    elem.removeClass('opening');
  }

  toggleSubmenuHover(event) {
    let self = this;
    if (
      this.isSidebarCollapsed() ||
      this.isSidebarCollapsedText() ||
      this.isEnabledHover()
    ) {
      event.preventDefault();

      this.removeFloatingNav();

      let ul = $(event.currentTarget.nextElementSibling);
      let anchor = $(event.currentTarget);

      if (!ul.length) {
        return;
      }

      let $leftSide = $('.left-side-container');
      let $leftSideInner = $leftSide.children('.left-side');
      let $sidebar = $leftSideInner.children('.sidebar');
      let mar =
        parseInt($leftSideInner.css('padding-top'), 0) +
        parseInt($leftSide.css('padding-top'), 0);
      let itemTop = anchor.parent().position().top + mar - $sidebar.scrollTop();

      let floatingNav = ul.clone().appendTo($leftSide);
      let vwHeight = document.body.clientHeight;

      floatingNav.addClass('sidebar-floating');

      const safeOffsetValue = 40 * 5;
      const navHeight = floatingNav.outerHeight(true) + 2;
      const safeOffset =
        navHeight < safeOffsetValue ? navHeight : safeOffsetValue;

      const displacement = 25;

      const menuTop =
        vwHeight - itemTop > safeOffset
          ? itemTop
          : vwHeight - safeOffset - displacement;

      floatingNav.removeClass('opening').css({
        position: this.switchers.getFrameSwitcher('isFixed')
          ? 'fixed'
          : 'absolute',
        top: menuTop,
        bottom:
          floatingNav.outerHeight(true) + menuTop > vwHeight
            ? displacement + 'px'
            : 'auto',
      });

      floatingNav
        .on('mouseleave', () => {
          floatingNav.remove();
        })
        .find('a')
        .on('click', function (e) {
          e.preventDefault();
          let routeTo = $(e.target).attr('route');
          if (routeTo) self.router.navigate([routeTo]);
        });

      this.listenForExternalClicks();
    }
  }

  listenForExternalClicks() {
    let $doc = $(document).on('click.sidebar', e => {
      if (!$(e.target).parents('.left-side-container').length) {
        this.removeFloatingNav();
        $doc.off('click.sidebar');
      }
    });
  }

  removeFloatingNav() {
    $('.sidebar-floating').remove();
  }

  isSidebarCollapsed() {
    return this.switchers.getFrameSwitcher('isCollapsed');
  }
  isSidebarCollapsedText() {
    return this.switchers.getFrameSwitcher('isCollapsedText');
  }
  isEnabledHover() {
    return this.switchers.getFrameSwitcher('leftSideHover');
  }

  private removeSubMenu = function (
    menu: Array<any>,
    menuItemName: string,
    submenuItemName: string
  ): Array<any> {
    let _menu = JSON.parse(JSON.stringify(menu));
    let menuItemIndex = _menu.findIndex(
      item => item.text.toLowerCase() === menuItemName.toLowerCase()
    );
    let submenu = _menu[menuItemIndex].submenu;
    if (submenu) {
      let submenuItemIndex = submenu.findIndex(
        item => item.text.toLowerCase() === submenuItemName.toLowerCase()
      );
      if (submenuItemIndex > -1) {
        submenu.splice(submenuItemIndex, 1);
      }
      return _menu;
    }
    return menu;
  };
}
