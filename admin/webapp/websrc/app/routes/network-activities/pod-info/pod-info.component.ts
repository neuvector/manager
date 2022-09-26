import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Workload } from "@common/types";
import { ActivityState, PopupState } from "@common/types/network-activities/activityState";
import { MapConstant } from "@common/constants/map.constant";
import { UtilsService } from "@common/utils/app.utils";
import { PodDetails } from "@common/types/network-activities/podDetails";

@Component({
  selector: 'app-pod-info',
  templateUrl: './pod-info.component.html',
  styleUrls: ['./pod-info.component.scss']
})
export class PodInfoComponent implements OnInit {
  private _pod!: PodDetails;
  private _popupState: ActivityState;

  displayState!: string;
  labelCode!: string;

  @Output()
  onPodGroupSelected: EventEmitter<string> = new EventEmitter<string>();

  get pod(): PodDetails {
    return this._pod;
  }

  @Input()
  set pod(value: PodDetails) {
    this._pod = value;
  }

  get popupState(): ActivityState {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  constructor(private utils: UtilsService) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngOnInit(): void {
    this.displayState = this.utils.getI18Name(this.pod.workload.state);
    this.labelCode = MapConstant.colourMap[this.pod.workload.state] || 'inverse';
  }

  showPodGroup() {
    this.onPodGroupSelected.emit(this.pod.workload.service_group);
  }
}
