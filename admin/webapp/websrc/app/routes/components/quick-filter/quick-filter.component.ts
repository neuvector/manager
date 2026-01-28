import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GridOptions, IRowNode, GridApi } from 'ag-grid-community';
import { FormControl } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-quick-filter',
  templateUrl: './quick-filter.component.html',
  styleUrls: ['./quick-filter.component.scss'],
})
export class QuickFilterComponent implements OnInit, OnChanges {
  @Input() gridOptions!: GridOptions;
  @Input() gridApi!: GridApi;
  @Input() count: number = 0;
  @Input() filteredCount: number = 0;
  @Input() showCount: boolean = true;
  @Input() condition: any = false;
  @Input() disabled: boolean = false;
  @Output() filterCountChange = new EventEmitter<number>();
  public totalCountText: string = '';
  public filteredCountText: string = '';
  public filter = new FormControl('');

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.filter.reset();
    this.displayCount();
    if (this.disabled) {
      this.filter.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.displayCount();
  }

  onFilterChange(filterStr: string) {
    if (this.gridOptions && this.gridApi) {
      this.count = this.gridApi.getDisplayedRowCount();
      this.gridApi.setQuickFilter(filterStr);
      const childrenAfterFilter: IRowNode[] =
        this.gridApi.getModel()['rootNode'].childrenAfterFilter;
      if (this.condition) {
        this.filteredCount = childrenAfterFilter.filter(this.condition).length;
      } else {
        this.filteredCount = childrenAfterFilter.length;
      }
      this.displayCount();
    }
  }

  displayCount() {
    let outOf = this.translate.instant('enum.OUT_OF');
    let found = this.translate.instant('enum.FOUND');
    if (
      (this.filter.value && !this.filteredCount) ||
      this.filteredCount !== this.count
    ) {
      this.filterCountChange.emit(this.filteredCount);
      this.filteredCountText = `${found} ${this.filteredCount}`;
    } else {
      this.filteredCountText = '';
    }
    this.totalCountText = `${outOf} ${this.count}`;
  }
}
