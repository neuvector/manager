import { Component, Input, OnInit } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { Host } from '@common/types';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';

@Component({
  standalone: false,
  selector: 'app-host-info',
  templateUrl: './host-info.component.html',
  styleUrls: ['./host-info.component.scss'],
})
export class HostInfoComponent implements OnInit {
  private _hostId!: string;
  private _popupState: ActivityState;
  host: Host = <Host>{};

  get hostId(): string {
    return this._hostId;
  }

  @Input()
  set hostId(value: string) {
    this._hostId = value;
  }

  get popupState(): ActivityState {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  constructor(private assetsHttpService: AssetsHttpService) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngOnInit(): void {
    this.assetsHttpService.getNodeBriefById(this.hostId).subscribe(
      response => (this.host = response['host']),
      err => console.warn(err)
    );
  }
}
