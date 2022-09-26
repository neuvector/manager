import { Injectable } from '@angular/core';
import { EventsHttpService } from '@common/api/events-http.service';
import { EventItem } from '@common/types';
import { uuid } from '@common/utils/common.utils';

export type EventRow = EventItem & {
  id: string;
  parent_id?: string;
  child_id?: string;
  visible: boolean;
};

export const iconMap = {
  AUTH: 'fa-key',
  ENFORCER: 'fa-shield',
  RESTFUL: 'fa-cogs',
  CONTROLLER: 'fa-magic',
  WORKLOAD: 'fa-cube',
  LICENSE: 'fa-gavel',
  SCANNER: 'fa-copy',
  INCIDENT: 'fa-bell',
};

@Injectable()
export class EventsService {
  private _events: EventItem[] = [];
  get events() {
    return this._events;
  }
  set events(events: EventItem[]) {
    this._events = events;
  }

  private _displayEvents: EventRow[] = [];
  get displayEvents() {
    return this._displayEvents;
  }
  set displayEvents(displayEvents: EventRow[]) {
    this._displayEvents = displayEvents;
  }

  constructor(private eventsHttpService: EventsHttpService) {}

  resetEvents() {
    this._events = [];
    this._displayEvents = [];
  }

  getEvents() {
    return this.eventsHttpService.getEvents();
  }

  getEventsByLimit(start: number, limit: number) {
    return this.eventsHttpService.getEventsByLimit(start, limit);
  }

  formatEvents(events: EventItem[]): EventRow[] {
    let res: EventRow[] = [];
    events.forEach(event => {
      const parent_id = uuid();
      if (event.message) {
        const child_id = uuid();
        res.push({ id: parent_id, child_id, ...event, visible: false });
        res.push({
          id: child_id,
          parent_id,
          ...event,
          visible: false,
        });
      } else {
        res.push({ id: parent_id, ...event, visible: true });
      }
    });
    return res;
  }

  static iconMap(category: string): string {
    return iconMap[category];
  }
}
