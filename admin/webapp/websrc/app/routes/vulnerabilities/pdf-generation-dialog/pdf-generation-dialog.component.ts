import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { VulnerabilitiesComponent } from '../vulnerabilities.component';
import { LastModifiedDateOption } from '@common/types';

const today = new Date();

@Component({
  selector: 'app-pdf-generation-dialog',
  templateUrl: './pdf-generation-dialog.component.html',
  styleUrls: ['./pdf-generation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfGenerationDialogComponent implements OnInit {
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
  });
  saving$ = new Subject();
  get customDate(): Date {
    return this.form.get('customDate')?.value;
  }
  get selectedDateOption(): LastModifiedDateOption {
    return this.form.get('dateOption')?.value;
  }

  constructor(
    public dialogRef: MatDialogRef<VulnerabilitiesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  @Output() submitDate = new EventEmitter();
  submit(): void {
    this.saving$.next(true);
    this.submitDate.emit(
      this.getDate(this.selectedDateOption, this.customDate)
    );
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
