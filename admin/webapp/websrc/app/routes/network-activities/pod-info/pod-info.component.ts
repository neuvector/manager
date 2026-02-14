import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ErrorResponse, Vulnerability, Workload } from '@common/types';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { PodDetails } from '@common/types/network-activities/podDetails';
import { Observable, forkJoin } from 'rxjs';
import { ScanService } from '@services/scan.service';

@Component({
  standalone: false,
  selector: 'app-pod-info',
  templateUrl: './pod-info.component.html',
  styleUrls: ['./pod-info.component.scss'],
})
export class PodInfoComponent implements OnInit {
  private _pod!: PodDetails;
  private _popupState: ActivityState;

  displayState!: string;
  labelCode!: string;

  vulnerabilities: Vulnerability[] = [];

  @Output()
  doPodGroupSelected: EventEmitter<string> = new EventEmitter<string>();
  onCveInfo: boolean = false;

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

  constructor(
    private scanService: ScanService,
    private utils: UtilsService
  ) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngOnInit(): void {
    this.displayState = this.utils.getI18Name(this.pod.workload.state);
    this.labelCode =
      MapConstant.colourMap[this.pod.workload.state] || 'inverse';
  }

  showPodGroup() {
    this.doPodGroupSelected.emit(this.pod.workload.service_group);
  }

  showCve() {
    let scanReport: Observable<Vulnerability[]>;

    if (this.pod.workload.children?.length > 0) {
      const result = forkJoin(
        this.pod.workload.children.map(element =>
          this.scanService.getContainerVuls(element.id, false)
        )
      );
      result.subscribe(
        data => {
          console.log(data.flat(1));
          if (data?.length > 0) this.vulnerabilities = data.flat(1);
          else this.vulnerabilities = [];
        },
        error => {
          console.log(error);
        }
      );
    } else {
      scanReport = this.scanService.getContainerVuls(
        this.pod.workload.id,
        false
      );
      scanReport.subscribe({
        next: vulnerabilities => {
          this.vulnerabilities = vulnerabilities;
        },
        error: ({ error }: { error: ErrorResponse }) => {
          console.log(error);
        },
      });
    }

    this.onCveInfo = true;
  }
}
