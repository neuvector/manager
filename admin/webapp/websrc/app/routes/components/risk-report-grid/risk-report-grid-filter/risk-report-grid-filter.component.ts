import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { DateFilterFn } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UtilsService } from '@common/utils/app.utils';
import { autocompleteValidator } from '@common/validators';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RiskReportGridComponent } from '../risk-report-grid.component';
import {
  FilterCategory,
  FilterLevel,
} from '../risk-report-grid.filter.service';


@Component({
  standalone: false,
  selector: 'app-risk-report-grid-filter',
  templateUrl: './risk-report-grid-filter.component.html',
  styleUrls: ['./risk-report-grid-filter.component.scss'],
  
})
export class RiskReportGridFilterComponent implements OnInit {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  namespaceCtrl = new FormControl();
  filteredHosts!: Observable<string[]>;
  filteredContainers!: Observable<string[]>;
  filteredImages!: Observable<string[]>;
  filteredDomains!: Observable<string[]>;
  form!: FormGroup;
  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;
  get filterLevel() {
    return Object.values(FilterLevel);
  }
  get filterCategory() {
    return Object.values(FilterCategory);
  }
  get levelFormArray() {
    return this.form.controls.level as FormArray;
  }
  get categoryFormArray() {
    return this.form.controls.category as FormArray;
  }
  fromFilter: DateFilterFn<Date | null> = this._fromFilter.bind(this);
  toFilter: DateFilterFn<Date | null> = this._toFilter.bind(this);
  today = new Date();

  constructor(
    public dialogRef: MatDialogRef<RiskReportGridComponent>,
    private utils: UtilsService,
    private tr: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.filteredDomains = this.namespaceCtrl.valueChanges.pipe(
      map((domain: string) => {
        return domain ? this._filterDomain(domain) : [];
      })
    );
  }

  getDisplayName(name: string) {
    return this.utils.getI18Name(name);
  }

  getDisplayCategory(category: string) {
    return this.tr.instant(`audit.${category.toUpperCase()}`);
  }

  getLevelsForm(levels: string[]) {
    const arr = Object.values(FilterLevel).map(
      l => new FormControl(levels.includes(l))
    );
    return new FormArray(arr);
  }

  getCategoryForm(categories: string[]) {
    const arr = Object.values(FilterCategory).map(
      c => new FormControl(categories.includes(c))
    );
    return new FormArray(arr);
  }

  ngOnInit() {
    const filter = this.data.filter;
    this.form = new FormGroup({
      reportedFrom: new FormControl(
        filter.reportedFrom ? new Date(filter.reportedFrom) : null
      ),
      reportedTo: new FormControl(
        filter.reportedTo ? new Date(filter.reportedTo) : null
      ),
      level: this.getLevelsForm(filter.level),
      category: this.getCategoryForm(filter.category),
      host: new FormControl(
        filter.host,
        autocompleteValidator(this.data.hosts)
      ),
      container: new FormControl(
        filter.container,
        autocompleteValidator(this.data.containers)
      ),
      image: new FormControl(
        filter.image,
        autocompleteValidator(this.data.images)
      ),
      selectedDomains: new FormControl(filter.selectedDomains),
      includedKeyword: new FormControl(filter.includedKeyword),
      excludedKeyword: new FormControl(filter.excludedKeyword),
    });
    this.initAutocomplete();
  }

  initAutocomplete(): void {
    this.filteredHosts = this.form.controls.host.valueChanges.pipe(
      map((host: string) => {
        return host ? this._filterHost(host) : [];
      })
    );
    this.filteredContainers = this.form.controls.container.valueChanges.pipe(
      map((container: string) => {
        return container ? this._filterContainer(container) : [];
      })
    );
    this.filteredImages = this.form.controls.image.valueChanges.pipe(
      map((image: string) => {
        return image ? this._filterImage(image) : [];
      })
    );
  }

  reset(): void {
    this.dialogRef.close({ reset: true });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.namespaceInput.nativeElement.value = '';
    if (
      this.form.controls.selectedDomains.value.includes(event.option.viewValue)
    ) {
      return;
    }
    this.form.controls.selectedDomains.value.push(event.option.viewValue);
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (
      this.data.domains.includes(value) &&
      !this.form.controls.selectedDomains.value.includes(value)
    ) {
      this.form.controls.selectedDomains.value.push(value);
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
    this.namespaceCtrl.setValue(null);
  }

  remove(domain: string): void {
    const chipIdx = this.form.controls.selectedDomains.value.indexOf(domain);
    if (chipIdx >= 0) {
      this.form.controls.selectedDomains.value.splice(chipIdx, 1);
    }
  }

  private _fromFilter(d: Date | null): boolean {
    const toDate = this.form?.get('reportedTo')?.value;
    if (d) {
      return d <= this.today && (toDate ? d <= toDate : true);
    }
    return true;
  }

  private _toFilter(d: Date | null): boolean {
    const fromDate = this.form?.get('reportedFrom')?.value;
    if (d) {
      return d <= this.today && (fromDate ? d >= fromDate : true);
    }
    return true;
  }

  private _filterDomain(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.domains
      .filter(
        domain => !this.form.controls.selectedDomains.value.includes(domain)
      )
      .filter(domain => domain.toLowerCase().includes(filterValue));
  }

  private _filterHost(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.hosts.filter(host =>
      host.toLowerCase().includes(filterValue)
    );
  }

  private _filterContainer(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.containers.filter(container =>
      container.toLowerCase().includes(filterValue)
    );
  }

  private _filterImage(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.images.filter(image =>
      image.toLowerCase().includes(filterValue)
    );
  }
}
