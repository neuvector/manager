import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  standalone: false,
  selector: 'app-registries-table-buttons',
  templateUrl: './registries-table-buttons.component.html',
  styleUrls: ['./registries-table-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistriesTableButtonsComponent implements ICellRendererAngularComp {
  params: any;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  isWriteRegistryAuthorized!: boolean;
  isFedAdmin!: boolean;
  isRemote: boolean = false;

  constructor(private authUtilsService: AuthUtilsService) {}

  agInit(params: any): void {
    this.params = params;
    this.isWriteRegistryAuthorized =
      this.authUtilsService.getDisplayFlag('registry_scan');
    this.isFedAdmin = this.authUtilsService.getDisplayFlag('multi_cluster_w');
    this.isRemote = GlobalVariable.isRemote;
  }

  edit(): void {
    this.params.edit(this.params);
  }

  delete(): void {
    this.params.delete(this.params);
  }

  view(): void {
    this.params.view(this.params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
