import { Injectable } from '@angular/core';
import { BytesPipe } from '@common/pipes/app.pipes';
import { UtilsService } from '@common/utils/app.utils';
import {
  arrayToCsv,
  numberWithCommas,
  parseDivideStyle,
} from '@common/utils/common.utils';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { MIN_UNIT64 } from '../events-grid.component';

@Injectable()
export class EventsGridCsvService {
  constructor(
    private utils: UtilsService,
    private bytesPipe: BytesPipe,
    private tr: TranslateService
  ) {}

  exportCSV(events4Csv): void {
    events4Csv = JSON.parse(JSON.stringify(events4Csv));
    events4Csv = events4Csv.map(event => {
      this.eventRow2Item(event);
      if (!event.enforcer_limit) event.enforcer_limit = 0;
      if (!event.license_expire) event.license_expire = '';
      if (event.user_roles) {
        event.user_roles = JSON.stringify(event.user_roles).replace(/\"/g, "'");
      }
      if (
        ['Controller.Memory.Pressure', 'Agent.Memory.Pressure'].includes(
          event.name
        )
      ) {
        event.message = this.renderMemoryPressureMessage4Csv(
          JSON.parse(event.message)
        );
      } else if (
        ['Controller.Memory.Overusage', 'Agent.Memory.Overusage'].includes(
          event.name
        )
      ) {
        event.message = this.renderMemoryOverusageMessage4Csv(
          JSON.parse(event.message)
        );
      } else {
        event.message = `${event.message.replace(/\"/g, "'")}`;
      }
      return event;
    });
    const eventCsv = arrayToCsv(events4Csv);
    const blob = new Blob([eventCsv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `Events_${this.utils.parseDatetimeStr(new Date())}.csv`);
  }

  private eventRow2Item(event) {
    delete event.id;
    delete event.parent_id;
    delete event.child_id;
    delete event.visible;
  }

  private renderMemoryPressureMessage4Csv(msg) {
    const itemMap = {
      Description: '',
      Level: '',
      UsageRatio: '',
      NetUsage: '',
      UsageLimit: '',
      ActiveAnon: '',
      InactiveAnon: '',
      MaxUsage: '',
      Cache: '',
      RSS: '',
      Failcnt: '',
      PageFaults: '',
    } as any;

    Object.entries(msg).forEach(([k, v]) => {
      if (k === 'Description') {
        itemMap[k] = v;
      } else {
        if (k !== 'Level' && k !== 'Failcnt' && k !== 'PageFaults') {
          if (k === 'UsageRatio') {
            itemMap[k] = `${this.tr.instant(
              `event.msg.${parseDivideStyle(k).toUpperCase()}`
            )}:${v}%`;
          } else {
            itemMap[k] = `${this.tr.instant(
              `event.msg.${parseDivideStyle(k).toUpperCase()}`
            )}:${this.bytesPipe.transform(v as any)}`;
          }
        } else {
          itemMap[k] = `${this.tr.instant(
            `event.msg.${parseDivideStyle(k).toUpperCase()}`
          )}:${numberWithCommas(v)}`;
        }
        if (k === 'UsageLimit' && v === MIN_UNIT64) {
          itemMap[k] = `${this.tr.instant('event.msg.NOT_SET_LIMIT')}`;
        }
      }
    });
    return Object.values(itemMap).join(';');
  }

  private renderMemoryOverusageMessage4Csv(msg) {
    const itemMap = {
      Percentage: '',
      SystemTotal: '',
      Usage: '',
      SystemFree: '',
    };
    Object.entries(msg).forEach(([k, v]) => {
      if (k === 'Percentage') {
        itemMap[k] = `${this.tr.instant(
          `event.msg.${parseDivideStyle(k).toUpperCase()}`
        )}:${v}`;
      } else {
        itemMap[k] = `${this.tr.instant(
          `event.msg.${parseDivideStyle(k).toUpperCase()}`
        )}:${this.bytesPipe.transform(v as any)}`;
      }
    });
    return Object.values(itemMap).join(';');
  }
}
