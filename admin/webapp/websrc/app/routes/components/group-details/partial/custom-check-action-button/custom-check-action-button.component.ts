import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from 'ag-grid-community';
import { ConfirmDialogComponent } from "@components/ui/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { GroupsService } from '@services/groups.service';

@Component({
  selector: 'app-custom-check-action-button',
  templateUrl: './custom-check-action-button.component.html',
  styleUrls: ['./custom-check-action-button.component.scss']
})
export class CustomCheckActionButtonComponent implements ICellRendererAngularComp {

  params!: ICellRendererParams;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private groupsService: GroupsService
  ) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  removeScript = (data) => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "700px",
      data: {
        message: `${this.translate.instant('group.script.msg.REMOVE_WARNING')} - ${data.name}`,
        isSync: true
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          let payload = {
            group: this.params.context.componentParent.groupName,
            config: {
              delete: {
                scripts: [data]
              }
            }
          };
          this.groupsService.updateCustomCheckData(payload)
            .subscribe(
              response => {
                this.params.context.componentParent.refresh();
              },
              error => {}
            );
        }
      }
    );
  };

}
