import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { GraphService } from '../graph.service';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';

import { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { BehaviorSubject } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-active-session',
  templateUrl: './active-session.component.html',
  styleUrls: ['./active-session.component.scss'],
})
export class ActiveSessionComponent implements AfterViewInit, OnInit {
  get entriesGridHeight(): number {
    return this._entriesGridHeight;
  }
  private resizeSubject$ = new BehaviorSubject<boolean>(true);
  resize$ = this.resizeSubject$.asObservable();

  @ViewChildren('conversations') edgeView!: QueryList<ElementRef>;
  @ViewChildren('entriesGridHeight') heightView!: QueryList<ElementRef>;
  @ViewChildren('currentName') nodeName!: QueryList<ElementRef>;

  private _currentName: string = '';

  get currentName(): string {
    return this._currentName;
  }

  @Input()
  set currentName(value: string) {
    this._currentName = value;
  }

  public autoRefresh: boolean = false;
  @Output() doAutoRefresh = new EventEmitter<boolean>();

  private _conversations;

  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;

  private _entriesGridHeight: number = 0;

  _popupState: ActivityState;

  get popupState() {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  constructor(
    private networkGraphService: GraphService,
    private cd: ChangeDetectorRef
  ) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngAfterViewInit(): void {
    this.resize$.subscribe(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
        this.cd.markForCheck();
      }
    });
  }

  get conversations() {
    return this._conversations;
  }

  @Input()
  set conversations(value) {
    this._conversations = value;
  }

  @Input()
  set entriesGridHeight(value) {
    this._entriesGridHeight = value;
  }

  ngOnInit() {
    this.autoRefresh = false;
    this.gridOptions = this.networkGraphService.prepareActiveSessionGrid();
    this.gridOptions.onGridReady = event => this.onGridReady(event);
  }

  stopRefreshSession = () => {
    this.doAutoRefresh.emit(false);
    this.autoRefresh = false;
  };

  doAutoRefreshToggle = value => {
    this.doAutoRefresh.emit(value);
    this.autoRefresh = value;
  };

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.conversations.length;
  }

  resize() {
    this.resizeSubject$.next(true);
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
    this.cd.markForCheck();
  }

  mouseUp(event) {
    if (event.target?.id == 'activeSessions') {
      this._entriesGridHeight = event.target.clientHeight - 120;
      this.gridApi.resetRowHeights();
      this.gridApi.sizeColumnsToFit();
    }
  }
}
