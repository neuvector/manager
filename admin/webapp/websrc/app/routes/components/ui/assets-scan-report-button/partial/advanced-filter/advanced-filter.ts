import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import {
  MatAutocompleteActivatedEvent,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Options } from '@angular-slider/ngx-slider';
import { TranslateService } from '@ngx-translate/core';
import { LastModifiedDateOption, VulnerabilityQuery } from '@common/types';
import { AssetsScanReportButton } from '../../assets-scan-report-button';

enum FilterView {
  IMAGE = 0,
  NODE = 1,
  CONTAINER = 2,
  V2 = 3,
  V3 = 4,
}

const today = new Date();

@Component({
  selector: 'app-advanced-filter',
  standalone: false,
  templateUrl: './advanced-filter.html',
  styleUrl: './advanced-filter.scss',
})
export class AdvancedFilter implements OnInit {
  dateOptions: LastModifiedDateOption[] = [
    'custom',
    'twoweeks',
    'onemonth',
    'threemonths',
  ];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  namespaceCtrl = new FormControl();
  filteredDomains!: Observable<string[]>;
  form!: FormGroup;
  matchTypes = [
    { id: 'equals', name: '=' },
    { id: 'not_equals', name: '!=' },
    {
      id: 'contains',
      name: this.translate.instant('admissionControl.operators.CONTAINS'),
    },
    {
      id: 'not_contains',
      name: this.translate.instant('admissionControl.operators.NOT_CONTAINS'),
    },
  ];
  view = FilterView.IMAGE;
  viewText = this.translate.instant('admissionControl.names.IMAGE');
  FilterView = FilterView;
  autocompleteTagsOptionActivated = false;
  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;

  options: Options = {
    floor: 0,
    ceil: 10,
    step: 1,
    showTicks: true,
  };

  constructor(
    public dialogRef: MatDialogRef<AssetsScanReportButton>,
    @Inject(MAT_DIALOG_DATA) public data,
    private translate: TranslateService
  ) {
    this.filteredDomains = this.namespaceCtrl.valueChanges.pipe(
      map((domain: string) => {
        return domain ? this._filter(domain) : [];
      })
    );
  }

  clear(num: FilterView) {
    switch (num) {
      case FilterView.IMAGE: {
        this.form.controls.imageName.reset();
        this.form.get('matchTypeImage')?.setValue(this.matchTypes[0].id);
        break;
      }
      case FilterView.NODE: {
        this.form.controls.nodeName.reset();
        this.form.get('matchTypeNode')?.setValue(this.matchTypes[0].id);
        break;
      }
      case FilterView.CONTAINER: {
        this.form.controls.containerName.reset();
        this.form.get('matchTypeContainer')?.setValue(this.matchTypes[0].id);
        break;
      }
      case FilterView.V2: {
        this.form.controls.scoreV2.reset();
        this.form.controls.scoreV2?.setValue([0, 10]);
        break;
      }
      case FilterView.V3: {
        this.form.controls.scoreV3.reset();
        this.form.controls.scoreV3?.setValue([0, 10]);
        break;
      }
    }
  }

  changeView(num: FilterView) {
    switch (num) {
      case FilterView.IMAGE: {
        this.viewText = this.translate.instant('admissionControl.names.IMAGE');
        break;
      }
      case FilterView.NODE: {
        this.viewText = this.translate.instant('admissionControl.names.NODE');
        break;
      }
      case FilterView.CONTAINER: {
        this.viewText = this.translate.instant(
          'admissionControl.names.CONTAINER'
        );
        break;
      }
    }
    this.view = num;
  }

  ngOnInit() {
    const filter = this.data.filter as VulnerabilityQuery;
    this.form = new FormGroup({
      scoreType: new FormControl(filter.scoreType),
      scoreV2: new FormControl(filter.scoreV2),
      scoreV3: new FormControl(filter.scoreV3),
      matchTypeNs: new FormControl(filter.matchTypeNs),
      selectedDomains: new FormControl(filter.selectedDomains),
      matchTypeImage: new FormControl(filter.matchTypeImage),
      imageName: new FormControl(filter.imageName),
      matchTypeNode: new FormControl(filter.matchTypeNode),
      nodeName: new FormControl(filter.nodeName),
      matchTypeContainer: new FormControl(filter.matchTypeContainer),
      containerName: new FormControl(filter.containerName),
    });

    if (!Array.isArray(this.form.controls.selectedDomains.value)) {
      this.form.controls.selectedDomains.setValue([]);
    }
    if (!Array.isArray(this.form.controls.scoreV2.value)) {
      this.form.controls.scoreV2.setValue([0, 10]);
    }
    if (!Array.isArray(this.form.controls.scoreV3.value)) {
      this.form.controls.scoreV3.setValue([0, 10]);
    }

    this.changeView(
      this.data.assetType === 'node' ? FilterView.NODE : FilterView.IMAGE
    );
  }

  submit(): void {
    let filter = this.form.getRawValue();
    this.dialogRef.close(filter);
  }

  optionActivated(event: MatAutocompleteActivatedEvent): void {
    if (event.option) {
      this.autocompleteTagsOptionActivated = true;
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.namespaceInput.nativeElement.value = '';
    if (
      this.form.controls.selectedDomains.value.includes(event.option.viewValue)
    ) {
      return;
    }
    this.form.controls.selectedDomains.value.push(event.option.viewValue);
    this.autocompleteTagsOptionActivated = false;
    this.namespaceCtrl.setValue(null);
    if (this.form.controls.selectedDomains.value.length > 0) {
      this.view = FilterView.CONTAINER;
      this.viewText = this.translate.instant(
        'admissionControl.names.CONTAINER'
      );
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (
      !this.autocompleteTagsOptionActivated &&
      value &&
      !this.form.controls.selectedDomains.value.includes(value)
    ) {
      this.form.controls.selectedDomains.value.push(value);
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
    this.namespaceCtrl.setValue(null);
    if (this.form.controls.selectedDomains.value.length > 0) {
      this.view = FilterView.CONTAINER;
      this.viewText = this.translate.instant(
        'admissionControl.names.CONTAINER'
      );
    }
  }

  remove(domain: string): void {
    const chipIdx = this.form.controls.selectedDomains.value.indexOf(domain);
    if (chipIdx >= 0) {
      this.form.controls.selectedDomains.value.splice(chipIdx, 1);
    }
    if (this.form.controls.selectedDomains.value.length > 0) {
      this.view = FilterView.CONTAINER;
      this.viewText = this.translate.instant(
        'admissionControl.names.CONTAINER'
      );
    }
  }

  getOperator(matchType: string | undefined): string {
    switch ((matchType || '').toLowerCase()) {
      case 'contains':
        return '~';
      case 'not_contains':
        return '!~';
      case 'equals':
      case 'eq':
        return '=';
      case 'not_equals':
      case '!eq':
        return '!=';
      default:
        return '!=';
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.domains
      .filter(
        domain => !this.form.controls.selectedDomains.value.includes(domain)
      )
      .filter(domain => domain.toLowerCase().includes(filterValue));
  }
}
