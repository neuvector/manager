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
import { GridOptions, RowNode } from 'ag-grid-community';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-quick-filter',
  templateUrl: './quick-filter.component.html',
  styleUrls: ['./quick-filter.component.scss'],
})
export class QuickFilterComponent implements OnInit, OnChanges {
  @Input() gridOptions!: GridOptions;
  @Input() count: number = 0;
  @Input() filteredCount: number = 0;
  @Input() showCount: boolean = true;
  @Input() condition: any = false;
  @Output() filterCountChange = new EventEmitter<number>();
  public totalCountText: string = '';
  public filteredCountText: string = '';
  public filter = new FormControl('');

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.filter.reset();
    this.displayCount();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.displayCount();
  }

  onFilterChange(filterStr: string) {
    if (this.gridOptions && this.gridOptions.api) {
      this.gridOptions.api.setQuickFilter(filterStr);
      const childrenAfterFilter: RowNode[] =
        this.gridOptions.api.getModel()['rootNode'].childrenAfterFilter;
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
    if (this.filteredCount !== this.count) {
      console.log(this.filteredCount);
      this.filterCountChange.emit(this.filteredCount);
      this.filteredCountText = `${found} ${this.filteredCount}`;
    } else {
      this.filteredCountText = '';
    }
    this.totalCountText = `${outOf} ${this.count}`;
  }
}
