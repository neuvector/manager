import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { Audit, EventItem } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface EventsResponse {
  events: EventItem[];
}

interface AuditsResponse {
  audits: Audit[];
}

@Injectable()
export class EventsHttpService {
  getEvents(): Observable<EventItem[]> {
    return GlobalVariable.http
      .get<EventsResponse>(PathConstant.EVENT_URL)
      .pipe(map(r => r.events));
  }

  getEventsByLimit(start: number, limit: number): Observable<EventItem[]> {
    return GlobalVariable.http
      .get<EventsResponse>(PathConstant.EVENT_URL, {
        params: {
          start,
          limit,
        },
      })
      .pipe(map(r => r.events));
  }

  getRiskReports(): Observable<Audit[]> {
    return GlobalVariable.http
      .get<AuditsResponse>(PathConstant.AUDIT_URL)
      .pipe(map(r => r.audits));
  }
}
