import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { Audit, EventItem } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

@Injectable()
export class EventsHttpService {
  getEvents(): Observable<EventItem[]> {
    return GlobalVariable.http
      .get<EventItem[]>(PathConstant.EVENT_URL)
      .pipe(pluck('events'));
  }

  getEventsByLimit(start: number, limit: number): Observable<EventItem[]> {
    return GlobalVariable.http
      .get<EventItem[]>(PathConstant.EVENT_URL, {
        params: {
          start,
          limit,
        },
      })
      .pipe(pluck('events'));
  }

  getRiskReports(): Observable<Audit[]> {
    return GlobalVariable.http
      .get<Audit[]>(PathConstant.AUDIT_URL)
      .pipe(pluck('audits'));
  }
}
