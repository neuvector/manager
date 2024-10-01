import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FrameService {

  private _sidebarCollapseEvent = new Subject();
  public onSidebarCollapseEvent$ = this._sidebarCollapseEvent.asObservable();
  constructor() { }

  dispatchToggleSidebarEvent() {
    this._sidebarCollapseEvent.next(true);
  }
}
