import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { VulnerabilitiesComponent } from '../vulnerabilities.component';
import { LastModifiedDateOption } from '@common/types';

const today = new Date();

@Component({
  standalone: false,
  selector: 'app-pdf-generation-dialog',
  templateUrl: './pdf-generation-dialog.component.html',
  styleUrls: ['./pdf-generation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfGenerationDialogComponent {
  dateOptions: LastModifiedDateOption[] = [
    'all',
    'twoweeks',
    'onemonth',
    'threemonths',
    'custom',
  ];
  form = new FormGroup({
    dateOption: new FormControl('all'),
    customDate: new FormControl(
      {
        value: null,
        disabled: true,
      },
      Validators.required
    ),
    withoutAppendix: new FormControl(false),
  });
  saving$ = new Subject();
  get customDate(): Date {
    return this.form.get('customDate')?.value || new Date();
  }
  get selectedDateOption(): LastModifiedDateOption {
    return (
      (this.form.get('dateOption')?.value as LastModifiedDateOption) ||
      this.dateOptions[0]
    );
  }

  get withoutAppendix(): boolean {
    return this.form.get('withoutAppendix')?.value || false;
  }

  constructor(
    public dialogRef: MatDialogRef<VulnerabilitiesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  @Output() submitDate = new EventEmitter();
  submit(): void {
    this.saving$.next(true);
    this.submitDate.emit({
      date: this.getDate(this.selectedDateOption, this.customDate),
      withoutAppendix: this.withoutAppendix,
    });
  }

  changeDateOption(selectedDateOption: LastModifiedDateOption) {
    if (selectedDateOption === 'custom') {
      this.form.controls['customDate'].enable();
    } else {
      this.form.controls['customDate'].disable();
    }
  }

  getDate(dateOption: LastModifiedDateOption, customDate: Date): Date | null {
    switch (dateOption) {
      case 'all':
        return null;
      case 'twoweeks':
        return new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 14
        );
      case 'onemonth':
        return new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
      case 'threemonths':
        return new Date(
          today.getFullYear(),
          today.getMonth() - 3,
          today.getDate()
        );
      case 'custom':
        return customDate;
    }
  }
}
