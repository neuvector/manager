import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ComplianceTagData, Host, IdName, Workload } from '@common/types';
import { ComplianceRegulationGridDialogComponent } from '@components/compliance-regulation-grid/compliance-regulation-grid-dialog/compliance-regulation-grid-dialog.component';
import { ContainerBriefDialogComponent } from '@components/container-brief/container-brief-dialog/container-brief-dialog.component';
import { NodeBriefDialogComponent } from '@components/node-brief/node-brief-dialog/node-brief-dialog.component';
import { ComplianceService } from '@routes/compliance/compliance.service';
import { take } from 'rxjs/operators';


@Component({
  standalone: false,
  selector: 'app-compliance-items-details',
  templateUrl: './compliance-items-details.component.html',
  styleUrls: ['./compliance-items-details.component.scss'],
  
})
export class ComplianceItemsDetailsComponent implements OnDestroy {
  selectedCompliance$ = this.complianceService.selectedCompliance$;
  legend = false;
  currentDialog!: MatDialogRef<any>;
  openDialog = false;

  constructor(
    private complianceService: ComplianceService,
    private dialog: MatDialog
  ) {}

  getTagData(tag) {
    return tag.value as ComplianceTagData[];
  }

  openNodeBrief(host: Host) {
    this.openDialog = true;
    this.currentDialog = this.dialog.open(NodeBriefDialogComponent, {
      width: '675px',
      position: { left: '25px', top: '130px' },
      hasBackdrop: false,
      data: host,
    });
    this.currentDialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => (this.openDialog = false));
  }

  openBrief(type: string, content: IdName) {
    if (type === 'node') {
      this.complianceService.getNodeBrief(content.id).subscribe({
        next: hostData => {
          if (this.openDialog) {
            this.currentDialog.close();
            this.currentDialog
              .afterClosed()
              .pipe(take(1))
              .subscribe(() => {
                this.openNodeBrief(hostData.host);
              });
          } else {
            this.openNodeBrief(hostData.host);
          }
        },
      });
    } else {
      this.complianceService.getContainerBrief(content.id).subscribe({
        next: workload => {
          let hasApps =
            workload.ports && Object.entries(workload.app_ports).length > 0;
          let apps;
          if (hasApps) {
            apps = Object.entries(workload.app_ports)
              .map(([k, v]) => {
                return `${k}/${v}`;
              })
              .join(', ');
          }
          const hasInterfaces =
            workload.interfaces &&
            Object.entries(workload.interfaces).length > 0;
          if (this.openDialog) {
            this.currentDialog.close();
            this.currentDialog
              .afterClosed()
              .pipe(take(1))
              .subscribe(() => {
                this.openContainerBrief(workload, hasApps, hasInterfaces, apps);
              });
          } else {
            this.openContainerBrief(workload, hasApps, hasInterfaces, apps);
          }
        },
      });
    }
  }

  openContainerBrief(
    workload: Workload,
    hasApps: boolean,
    hasInterfaces: boolean,
    apps: any
  ) {
    this.openDialog = true;
    this.currentDialog = this.dialog.open(ContainerBriefDialogComponent, {
      width: '800px',
      position: { left: '25px', top: '130px' },
      hasBackdrop: false,
      data: { workload, hasApps, hasInterfaces, apps },
    });
    this.currentDialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => (this.openDialog = false));
  }

  openRegulation(type: string, content: ComplianceTagData[], name: string) {
    console.log(content);
    this.openDialog = true;
    this.currentDialog = this.dialog.open(
      ComplianceRegulationGridDialogComponent,
      {
        width: '800px',
        position: { left: '25px', top: '130px' },
        hasBackdrop: false,
        data: { type, content, name },
      }
    );
    this.currentDialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => (this.openDialog = false));
  }

  getComplianceTagClass(type: string) {
    switch (type) {
      case 'DISA':
        return 'badge-dark';
      case 'GDPR':
        return 'text-white';
      case 'HIPAA':
        return 'text-white';
      case 'NIST':
        return 'badge-dark';
      case 'PCI':
        return 'text-white';
      case 'PCIv4':
        return 'text-white';
      default:
        return '';
    }
  }

  getComplianceTagStyle(type: string) {
    switch (type) {
      case 'DISA':
        return '';
      case 'GDPR':
        return 'background-color: #ff9800';
      case 'HIPAA':
        return 'background-color: #4e39c1';
      case 'NIST':
        return '';
      case 'PCI':
        return 'background-color: #009688';
      case 'PCIv4':
        return 'background-color: #009688';
      default:
        return '';
    }
  }

  ngOnDestroy() {
    if (this.openDialog) {
      this.currentDialog.close();
    }
  }
}
