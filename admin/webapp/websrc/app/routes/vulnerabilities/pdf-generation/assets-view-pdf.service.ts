import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AssetsViewPdfService {
  private progressSubject$ = new BehaviorSubject<number>(0);
  progress$ = this.progressSubject$.asObservable();

  constructor(
  ) {}

  private _masterData;

  set masterData(val) {
    this._masterData = val;
  }

}
