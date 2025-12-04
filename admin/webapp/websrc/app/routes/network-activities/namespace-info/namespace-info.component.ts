import { Component, Input, OnInit } from '@angular/core';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import { GridOptions } from 'ag-grid-community';
import { GraphService } from '@routes/network-activities/graph.service';

@Component({
  standalone: false,
  selector: 'app-namespace-info',
  templateUrl: './namespace-info.component.html',
  styleUrls: ['./namespace-info.component.scss'],
})
export class NamespaceInfoComponent implements OnInit {
  private _popupState: ActivityState;
  private _domainName: string = '';
  private _members;

  get members() {
    return this._members;
  }

  @Input()
  set members(value) {
    this._members = value;
  }

  gridOptions!: GridOptions;

  get popupState() {
    return this._popupState;
  }

  get domainName(): string {
    return this._domainName;
  }

  @Input()
  set domainName(value: string) {
    this._domainName = value;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  constructor(public graphService: GraphService) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngOnInit(): void {
    this.gridOptions = this.graphService.prepareDomainGrid();
  }
}
