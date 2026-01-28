import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { InputDialogComponent } from '@components/ui/input-dialog/input-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-chips-input',

  templateUrl: './chips-input.component.html',
  styleUrls: ['./chips-input.component.scss'],
})
export class ChipsInputComponent extends FieldType<FieldTypeConfig> {
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  chips: string[] = [];

  constructor(
    private dialog: MatDialog,
    private tr: TranslateService
  ) {
    super();
  }

  add(event: MatChipInputEvent): void {
    const value = event.value;

    if ((value || '').trim()) {
      this.formControl.setValue([...this.formControl.value, value.trim()]);
      this.formControl.updateValueAndValidity();
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  edit(chip: string): void {
    let index = this.formControl.value.indexOf(chip);
    const dialogRef = this.dialog.open(InputDialogComponent, {
      data: {
        input: chip,
        title: this.tr.instant(this.to.editTitle),
      },
    });
    dialogRef.afterClosed().subscribe(input => {
      const value = (input || '').trim();
      if (value) {
        this.formControl.setValue(
          this.formControl.value.map((filter, idx) =>
            idx === index ? value : filter
          )
        );
      }
    });
  }

  remove(fruit: string): void {
    const index = this.formControl.value.indexOf(fruit);

    if (index >= 0) {
      this.formControl.value.splice(index, 1);
      this.formControl.updateValueAndValidity();
    }
  }
}
