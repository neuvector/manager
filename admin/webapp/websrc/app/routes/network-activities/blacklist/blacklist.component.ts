import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { map } from 'rxjs/operators';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import {
  Blacklist,
  GraphEndpoint,
  GraphItem,
  GroupItem,
} from '@common/types/network-activities/blacklist';


@Component({
  standalone: false,
  selector: 'app-blacklist',
  templateUrl: './blacklist.component.html',
  styleUrls: ['./blacklist.component.scss'],
  
})
export class BlacklistComponent implements OnInit {
  get blacklist(): Blacklist {
    return this._blacklist;
  }

  @Input()
  set blacklist(value: Blacklist) {
    this._blacklist = value;
  }
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private _popupState: ActivityState;
  namespaceCtrl = new FormControl();
  filteredDomains!: Observable<GraphItem[]>;
  groupCtrl = new FormControl();
  filteredGroups!: Observable<GroupItem[]>;
  nodeCtrl = new FormControl();
  filteredNodes!: Observable<GraphEndpoint[]>;
  form!: FormGroup;
  @ViewChild('namespaceInput') namespaceInput!: ElementRef<HTMLInputElement>;
  @ViewChild('groupInput') groupInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nodeInput') nodeInput!: ElementRef<HTMLInputElement>;

  showButton = {};
  showGrpButton = {};
  showEdpButton = {};

  domainChips: any[] = [];
  groupChips: any[] = [];
  nodeChips: any[] = [];

  private _blacklist!: Blacklist;

  @Output()
  doReset: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  doApply: EventEmitter<Blacklist> = new EventEmitter<Blacklist>();

  get popupState(): ActivityState {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  private _domains: GraphItem[] = [];
  get domains(): GraphItem[] {
    return this._domains;
  }

  @Input()
  set domains(value: GraphItem[]) {
    this._domains = value;
  }

  private _groups: GroupItem[] = [];
  get groups(): { name: string; displayName: string }[] {
    return this._groups;
  }

  @Input()
  set groups(value: GroupItem[]) {
    this._groups = value;
  }

  private _nodes: { name: string; id: string }[] = [];
  get nodes(): { name: string; id: string }[] {
    return this._nodes;
  }

  @Input()
  set nodes(value: { name: string; id: string }[]) {
    this._nodes = value;
  }

  constructor() {
    this._popupState = new ActivityState(PopupState.onInit);
    this.filteredDomains = this.namespaceCtrl.valueChanges.pipe(
      map((domain: GraphItem) =>
        domain ? this._filter(domain) : this.domains.slice()
      )
    );
    this.filteredGroups = this.groupCtrl.valueChanges.pipe(
      map((group: GroupItem) =>
        group ? this._groupFilter(group) : this.groups.slice()
      )
    );
    this.filteredNodes = this.nodeCtrl.valueChanges.pipe(
      map((node: GraphEndpoint) =>
        node ? this._nodeFilter(node) : this.nodes.slice()
      )
    );
  }

  ngOnInit(): void {
    const list = this.blacklist;
    this.domainChips = list.domains;
    this.groupChips = list.groups;
    this.nodeChips = list.endpoints;
    this.form = new FormGroup({
      // selectedDomains: new FormControl(list.domains),
      // selectedGroups: new FormControl(list.groups),
      // selectedNodes: new FormControl(list.endpoints),
      hideUnmanaged: new FormControl(list.hideUnmanaged),
    });
  }

  reset() {
    this.blacklist = {
      domains: [],
      groups: [],
      endpoints: [],
      hideUnmanaged: false,
    };
    this.doReset.emit('reset');
  }

  apply() {
    this.blacklist.domains = this.domainChips;
    this.blacklist.groups = this.groupChips;
    this.blacklist.endpoints = this.nodeChips;
    this.blacklist.hideUnmanaged = this.form.value.hideUnmanaged;
    this.doApply.emit(this.blacklist);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.namespaceInput.nativeElement.value = '';
    if (this.domainChips.includes(event.option.value))
      return;
    this.domainChips.push(event.option.value);
    this.namespaceCtrl.setValue(null);
  }

  add(event: MatChipInputEvent): void {
    this.addItem(event, this._domains, 'name', 'domain');
    this.namespaceCtrl.setValue(null);
  }

  remove(domain: string, index: number): void {
    this.domainChips.splice(index, 1);
  }

  groupSelected(event: MatAutocompleteSelectedEvent): void {
    this.groupInput.nativeElement.value = '';
    if (this.groupChips.includes(event.option.value))
      return;
    this.groupChips.push(event.option.value);
    this.groupCtrl.setValue(null);
  }

  addGroup(event: MatChipInputEvent): void {
    this.addItem(event, this._groups, 'name', 'group');
    this.groupCtrl.setValue(null);
  }

  removeGroup(group: string, index: number) {
    this.groupChips.splice(index, 1);
  }

  nodeSelected(event: MatAutocompleteSelectedEvent): void {
    this.nodeInput.nativeElement.value = '';
    if (this.nodeChips.includes(event.option.value))
      return;
    this.nodeChips.push(event.option.value);
    this.nodeCtrl.setValue(null);
  }

  addNode(event: MatChipInputEvent): void {
    this.addItem(event, this._nodes, 'id', 'endpoint');
    this.nodeCtrl.setValue(null);
  }

  removeNode(node: GraphEndpoint, index: number): void {
    this.nodeChips.splice(index, 1);
  }

  private _filter(value: any): GraphItem[] {
    return this.filter(value, this._domains, 'name', 'domain');
  }

  private _groupFilter(value: any): GroupItem[] {
    return this.filter(value, this._groups, 'name', 'group');
  }

  private _nodeFilter(value: any): GraphEndpoint[] {
    return this.filter(value, this._nodes, 'id', 'endpoint');
  }

  private filter(value: any, list: any[], key: string, type: string): any[] {
    const selectedItems = {
      domain: this.domainChips,
      group: this.groupChips,
      endpoint: this.nodeChips,
    };
    const filterValue =
      value === null || value instanceof Object ? '' : value.toLowerCase();

    const matches = list.filter(item =>
      item[key].toLowerCase().includes(filterValue)
    );
    const formValue = selectedItems[type];
    return formValue === null
      ? matches
      : matches.filter(x => !formValue.find(y => y[key] === x[key]));
  }

  private addItem(
    event: MatChipInputEvent,
    list: any[],
    key: string,
    type: string
  ): void {
    const selectedItems = {
      domain: this.form.controls.selectedDomains,
      group: this.form.controls.selectedGroups,
      endpoint: this.form.controls.selectedNodes,
    };
    const value = (event.value || '').trim();

    const matches = list.filter(item => item[key].toLowerCase() === value);
    const formValue = selectedItems[type].value;
    const matchesNotYetSelected =
      formValue === null
        ? matches
        : matches.filter(x => !formValue.find(y => y[key] === x[key]));
    if (matchesNotYetSelected.length === 1)
      selectedItems[type].value.push(matchesNotYetSelected[0]);

    event.chipInput?.clear();
  }
}
