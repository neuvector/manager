import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { PortsFullListModalComponent } from '@components/network-rules/partial/ports-full-list-modal/ports-full-list-modal.component';


@Component({
  standalone: false,
  selector: 'app-ports-cell',
  templateUrl: './ports-cell.component.html',
  styleUrls: ['./ports-cell.component.scss'],
  
})
export class PortsCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  ports!: string;
  portCount: number = 0;

  constructor(private dialog: MatDialog, private translate: TranslateService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.ports =
      this.params.value === 'any'
        ? this.translate.instant('enum.ANY')
        : this.params.value;
    this.portCount = this.params.value.split(',').length;
    if (this.portCount > 2) {
      this.ports = this.params.value
        .split(',')
        .slice(0, 2)
        .join(',')
        .toString();
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  showAllPorts = (ruleId: number, ports: string) => {
    const portsFullListDialogRef = this.dialog.open(
      PortsFullListModalComponent,
      {
        width: '600px',
        data: {
          ruleId: ruleId,
          ports: ports.split(','),
        },
      }
    );
  };
}
