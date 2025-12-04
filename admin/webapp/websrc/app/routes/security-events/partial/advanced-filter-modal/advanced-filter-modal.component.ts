import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  FilterSeverity,
  FilterLocation,
  FilterCategory,
  Other,
} from './advanced-filter-modal.service';
import { autocompleteValidator } from '@common/validators';
import { UtilsService } from '@common/utils/app.utils';


@Component({
  standalone: false,
  selector: 'app-advanced-filter-modal',
  templateUrl: './advanced-filter-modal.component.html',
  styleUrls: ['./advanced-filter-modal.component.scss'],
  
})
export class AdvancedFilterModalComponent implements OnInit {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  namespaceCtrl = new FormControl();
  filteredSources!: Observable<string[]>;
  filteredDestinations!: Observable<string[]>;
  filteredHosts!: Observable<string[]>;
  filteredDomains!: Observable<string[]>;
  form!: FormGroup;
  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;
  get filterSeverity() {
    return Object.values(FilterSeverity);
  }
  get severityFormArray() {
    return this.form.controls.severity as FormArray;
  }
  get filterLocation() {
    return Object.values(FilterLocation);
  }
  get locationFormArray() {
    return this.form.controls.location as FormArray;
  }
  get filterCategory() {
    return Object.values(FilterCategory);
  }
  get categoryFormArray() {
    return this.form.controls.category as FormArray;
  }
  get otherFormArray() {
    return this.form.controls.other as FormArray;
  }
  get filterOther() {
    return Object.values(Other);
  }

  constructor(
    public dialogRef: MatDialogRef<AdvancedFilterModalComponent>,
    private utils: UtilsService,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.filteredDomains = this.namespaceCtrl.valueChanges.pipe(
      map((domain: string) => {
        return domain ? this._filterDomain(domain) : [];
      })
    );
  }

  getSeverityForm(severityList: string[]) {
    const arr = Object.values(FilterSeverity).map(
      severity => new FormControl(severityList.includes(severity))
    );
    return new FormArray(arr);
  }

  getLocationForm(locationList: string[]) {
    const arr = Object.values(FilterLocation).map(
      location => new FormControl(locationList.includes(location))
    );
    return new FormArray(arr);
  }

  getCategoryForm(categoryList: string[]) {
    const arr = Object.values(FilterCategory).map(
      category => new FormControl(categoryList.includes(category))
    );
    return new FormArray(arr);
  }

  getOtherForm(otherList: string[]) {
    const arr = Object.values(Other).map(
      other => new FormControl(otherList.includes(other))
    );
    return new FormArray(arr);
  }

  getDisplayName(name: string) {
    return this.utils.getI18Name(name);
  }

  ngOnInit() {
    const filter = this.data.filter;
    this.form = new FormGroup({
      reportedFrom: new FormControl(filter.reportedFrom),
      reportedTo: new FormControl(filter.reportedTo),
      severity: this.getSeverityForm(filter.severity),
      location: this.getLocationForm(filter.location),
      category: this.getCategoryForm(filter.category),
      other: this.getOtherForm(filter.other),
      source: new FormControl(
        filter.source,
        autocompleteValidator(this.data.sources)
      ),
      destination: new FormControl(
        filter.destination,
        autocompleteValidator(this.data.destinations)
      ),
      host: new FormControl(
        filter.host,
        autocompleteValidator(this.data.hosts)
      ),
      selectedDomains: new FormControl(filter.selectedDomains),
      includedKeyword: new FormControl(filter.includedKeyword),
      excludedKeyword: new FormControl(filter.excludedKeyword),
    });
    this.initAutocomplete();
  }

  initAutocomplete(): void {
    this.filteredSources = this.form.controls.source.valueChanges.pipe(
      map((source: string) => {
        return source ? this._filterSource(source) : [];
      })
    );
    this.filteredDestinations =
      this.form.controls.destination.valueChanges.pipe(
        map((destination: string) => {
          return destination ? this._filterDestination(destination) : [];
        })
      );
    this.filteredHosts = this.form.controls.host.valueChanges.pipe(
      map((host: string) => {
        return host ? this._filterHost(host) : [];
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

  private _filterDomain(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.domains
      .filter(
        domain => !this.form.controls.selectedDomains.value.includes(domain)
      )
      .filter(domain => domain.toLowerCase().includes(filterValue));
  }

  private _filterSource(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.sources.filter(source =>
      source.toLowerCase().includes(filterValue)
    );
  }

  private _filterDestination(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.destinations.filter(destination =>
      destination.toLowerCase().includes(filterValue)
    );
  }

  private _filterHost(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.hosts.filter(host =>
      host.toLowerCase().includes(filterValue)
    );
  }
}
