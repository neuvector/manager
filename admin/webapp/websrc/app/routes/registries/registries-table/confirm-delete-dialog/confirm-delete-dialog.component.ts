import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RegistriesTableComponent } from '../registries-table.component';
import { RegistriesService } from '@services/registries.service';
import { RegistriesCommunicationService } from '../../regestries-communication.service';

export interface ConfirmDeleteDialog {
  name: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrls: ['./confirm-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialogComponent {
  deleting$ = this.registriesCommunicationService.deleting$;

  constructor(
    public dialogRef: MatDialogRef<RegistriesTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteDialog,
    private registriesService: RegistriesService,
    private registriesCommunicationService: RegistriesCommunicationService
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.registriesCommunicationService.initDelete();
    this.registriesService.deleteRegistry(this.data.name).subscribe(() => {
      this.registriesCommunicationService.refreshRegistries();
      this.deleting$.subscribe(v => {
        if (!v) {
          this.onNoClick();
        }
      });
    });
  }
}
