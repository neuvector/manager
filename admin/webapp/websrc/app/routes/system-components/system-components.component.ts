import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { ControllersGridComponent } from '@components/controllers-grid/controllers-grid.component';
import { EnforcersGridComponent } from '@components/enforcers-grid/enforcers-grid.component';
import { ScannersGridComponent } from '@components/scanners-grid/scanners-grid.component';
import { Subscription } from 'rxjs';
import { ControllerDetailsComponent } from './controller-details/controller-details.component';
import { EnforcerDetailsComponent } from './enforcer-details/enforcer-details.component';
import { SystemComponentsCommunicationService } from './system-components-communication.service';


@Component({
  standalone: false,
  selector: 'app-system-components',
  templateUrl: './system-components.component.html',
  styleUrls: ['./system-components.component.scss'],
  
})
export class SystemComponentsComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ControllersGridComponent)
  controllersGrid!: ControllersGridComponent;
  @ViewChild(ControllerDetailsComponent)
  controllerDetails!: ControllerDetailsComponent;
  @ViewChild(ScannersGridComponent) scannersGrid!: ScannersGridComponent;
  @ViewChild(EnforcersGridComponent) enforcersGrid!: EnforcersGridComponent;
  @ViewChild(EnforcerDetailsComponent)
  enforcerDetails!: EnforcerDetailsComponent;
  activeTabIndex: number = 0;
  error: unknown;
  resize = true;
  activeSub!: Subscription;

  constructor(
    private componentsCommunicationService: SystemComponentsCommunicationService
  ) {}

  ngAfterViewInit(): void {
    this.activeSub = this.controllersGrid.selectedController.subscribe(
      controller => {
        this.componentsCommunicationService.setSelectedController(controller);
      }
    );
  }

  ngOnDestroy(): void {
    this.componentsCommunicationService.clearStats();
  }

  unsubDetails() {
    this.componentsCommunicationService.clearStats();
  }

  activateTab(event): void {
    this.activeSub.unsubscribe();
    this.unsubDetails();
    this.resize = !this.resize;
    this.activeTabIndex = event.index;
    switch (this.activeTabIndex) {
      case 0:
        this.controllerDetails.initTabs();
        this.activeSub = this.controllersGrid.selectedController.subscribe(
          controller => {
            this.componentsCommunicationService.setSelectedController(
              controller
            );
          }
        );
        break;
      case 1:
        this.activeSub = this.scannersGrid.selectedScanner.subscribe(
          scanner => {
            this.componentsCommunicationService.setSelectedScanner(scanner);
          }
        );
        break;
      case 2:
        this.enforcerDetails.initTabs();
        this.activeSub = this.enforcersGrid.selectedEnforcer.subscribe(
          enforcer => {
            this.componentsCommunicationService.setSelectedEnforcer(enforcer);
          }
        );
        break;
    }
  }
}
