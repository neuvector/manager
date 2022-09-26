/* tslint:disable:no-unused-variable */
import { TestBed, async, inject } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { RouterModule, Router } from '@angular/router';

import { MenuService } from '../../core/menu/menu.service';
import { SwitchersService } from '../../core/switchers/switchers.service';

describe('Component: Sidebar', () => {
  let mockRouter = {
    navigate: jasmine.createSpy('navigate'),
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MenuService,
        SwitchersService,
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  it('should create an instance', async(
    inject(
      [MenuService, SwitchersService, Router],
      (menuService, switchersService, router) => {
        let component = new SidebarComponent(
          menuService,
          switchersService,
          router
        );
        expect(component).toBeTruthy();
      }
    )
  ));
});
