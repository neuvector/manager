import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-registries-table-buttons',
  templateUrl: './registries-table-buttons.component.html',
  styleUrls: ['./registries-table-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistriesTableButtonsComponent
  implements ICellRendererAngularComp
{
  private params: any;

  agInit(params: any): void {
    this.params = params;
  }

  edit(): void {
    this.params.edit(this.params);
  }

  delete(): void {
    this.params.delete(this.params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
