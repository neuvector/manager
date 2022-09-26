import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ComplianceItemsTableComponent } from '../compliance-items-table.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { ComplianceFilterService } from '../../../compliance.filter.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { map } from 'rxjs/operators';

enum FilterView {
  SERVICE = 0,
  IMAGE = 1,
  NODE = 2,
  CONTAINER = 3,
}

@Component({
  selector: 'app-compliance-items-table-filter',
  templateUrl: './compliance-items-table-filter.component.html',
  styleUrls: ['./compliance-items-table-filter.component.scss'],
})
export class ComplianceItemsTableFilterComponent implements OnInit {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  namespaceCtrl = new FormControl();
  filteredDomains!: Observable<string[]>;
  form!: FormGroup;
  matchTypes = this.complianceFilterService.matchTypes;
  view = FilterView.SERVICE;
  viewText = 'Service';
  FilterView = FilterView;
  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<ComplianceItemsTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private complianceFilterService: ComplianceFilterService
  ) {
    this.filteredDomains = this.namespaceCtrl.valueChanges.pipe(
      map((domain: string) => {
        return domain ? this._filter(domain) : [];
      })
    );
  }

  clear(num: FilterView) {
    switch (num) {
      case FilterView.SERVICE: {
        this.form.controls.serviceName.reset();
        this.form
          .get(['matchTypes', 'Service'])
          ?.setValue(this.matchTypes[0].id);
        break;
      }
      case FilterView.IMAGE: {
        this.form.controls.imageName.reset();
        this.form.get(['matchTypes', 'Image'])?.setValue(this.matchTypes[0].id);
        break;
      }
      case FilterView.NODE: {
        this.form.controls.nodeName.reset();
        this.form.get(['matchTypes', 'Node'])?.setValue(this.matchTypes[0].id);
        break;
      }
      case FilterView.CONTAINER: {
        this.form.controls.containerName.reset();
        this.form
          .get(['matchTypes', 'Container'])
          ?.setValue(this.matchTypes[0].id);
        break;
      }
    }
  }

  changeView(num: FilterView) {
    switch (num) {
      case FilterView.SERVICE: {
        this.viewText = 'Service';
        break;
      }
      case FilterView.IMAGE: {
        this.viewText = 'Image';
        break;
      }
      case FilterView.NODE: {
        this.viewText = 'Node';
        break;
      }
      case FilterView.CONTAINER: {
        this.viewText = 'Container';
        break;
      }
    }
    this.view = num;
  }

  ngOnInit() {
    const filter = this.data.filter;
    this.form = new FormGroup({
      category: new FormGroup({
        docker: new FormControl(filter.category.docker),
        kubernetes: new FormControl(filter.category.kubernetes),
        custom: new FormControl(filter.category.custom),
        image: new FormControl(filter.category.image),
      }),
      tags: new FormGroup({
        gdpr: new FormControl(filter.tags.gdpr),
        hipaa: new FormControl(filter.tags.hipaa),
        nist: new FormControl(filter.tags.nist),
        pci: new FormControl(filter.tags.pci),
      }),
      scoredType: new FormControl(filter.scoredType),
      profileType: new FormControl(filter.profileType),
      selectedDomains: new FormControl(filter.selectedDomains),
      serviceName: new FormControl(filter.serviceName),
      imageName: new FormControl(filter.imageName),
      nodeName: new FormControl(filter.nodeName),
      containerName: new FormControl(filter.containerName),
      matchType4Ns: new FormControl(filter.matchType4Ns.id),
      matchTypes: new FormGroup({
        Service: new FormControl(filter.matchTypes.Service.id),
        Image: new FormControl(filter.matchTypes.Image.id),
        Node: new FormControl(filter.matchTypes.Node.id),
        Container: new FormControl(filter.matchTypes.Container.id),
      }),
    });
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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.domains
      .filter(
        domain => !this.form.controls.selectedDomains.value.includes(domain)
      )
      .filter(domain => domain.toLowerCase().includes(filterValue));
  }
}
