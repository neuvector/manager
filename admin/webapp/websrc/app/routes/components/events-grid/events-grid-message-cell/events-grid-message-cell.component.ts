import { Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { BytesPipe } from '@common/pipes/app.pipes';
import { numberWithCommas, parseDivideStyle } from '@common/utils/common.utils';
import { TranslateService } from '@ngx-translate/core';
import { EventsService } from '@services/events.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MIN_UNIT64 } from '../events-grid.component';

@Component({
  standalone: false,
  selector: 'app-events-grid-message-cell',
  templateUrl: './events-grid-message-cell.component.html',
  styleUrls: ['./events-grid-message-cell.component.scss'],
})
export class EventsGridMessageCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  labelCode!: string;
  iconCode!: string;
  message!: string;
  get data() {
    return this.params.data;
  }

  constructor(private tr: TranslateService, private bytesPipe: BytesPipe) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.labelCode = MapConstant.colourMap[this.data.level];
    this.iconCode = EventsService.iconMap(this.data.category);
    this.message = this.getMessage(this.data.message);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  getMessage(message: string): string {
    message = [
      'Controller.Memory.Pressure',
      'Controller.Memory.Overusage',
      'Agent.Memory.Pressure',
      'Agent.Memory.Overusage',
    ].includes(this.data.name)
      ? JSON.parse(message)
      : this.convertMessage(message)
          .replace(/\n/g, '<br/>')
          .replace(/\s/g, '&nbsp;');
    if (this.data.user_addr) {
      message = `${message} ${this.tr
        .instant('policy.addPolicy.FROM')
        .toLowerCase()} ${this.data.user_addr}`;
    }
    if (this.data.rest_request) {
      message = `${message}<br/>
                 <strong>${this.tr.instant(
                   'event.gridHeader.REST_REQ'
                 )}:</strong> \
                 ${
                   this.data.rest_method
                     ? `${this.data.rest_method.toUpperCase()} - `
                     : ''
                 }${this.data.rest_request}<br/>
                 ${
                   this.data.rest_body
                     ? `<strong>${this.tr.instant(
                         'event.gridHeader.REST_BODY'
                       )}:</strong> ${this.data.rest_body}`
                     : ''
                 }`;
    }

    if (
      ['Controller.Memory.Pressure', 'Agent.Memory.Pressure'].includes(
        this.data.name
      )
    ) {
      message = this.renderMemoryPressureMessage(message);
    }
    if (
      ['Controller.Memory.Overusage', 'Agent.Memory.Overusage'].includes(
        this.data.name
      )
    ) {
      message = this.renderMemoryOverusageMessage(message);
    }
    return message;
  }

  convertMessage(msg: string) {
    return msg.replace(/CustomResourceDefinition/g, 'CRD');
  }

  renderMemoryPressureMessage(msg) {
    let description = '';
    const itemMap = {
      Level: '',
      NetUsage: '',
      UsageLimit: '',
      ActiveAnon: '',
      InactiveAnon: '',
      MaxUsage: '',
      Cache: '',
      RSS: '',
      Failcnt: '',
      PageFaults: '',
    };

    Object.entries(msg).forEach(([k, v]) => {
      if (k === 'Description') {
        description = `<div class="col-sm-12 text-warning">${v}</div>`;
      } else {
        if (k !== 'Level' && k !== 'Failcnt' && k !== 'PageFaults') {
          itemMap[
            k
          ] = `<div class="col-sm-6"><span class="text-bold">${this.tr.instant(
            `event.msg.${parseDivideStyle(k).toUpperCase()}`
          )}:</span>&nbsp;<span>${this.bytesPipe.transform(
            v as any
          )}</span></div>`;
        } else {
          itemMap[
            k
          ] = `<div class="col-sm-6"><span class="text-bold">${this.tr.instant(
            `event.msg.${parseDivideStyle(k).toUpperCase()}`
          )}:</span>&nbsp;<span>${numberWithCommas(v)}</span></div>`;
        }
        if (k === 'UsageLimit' && v === MIN_UNIT64) {
          itemMap[
            k
          ] = `<div class="col-sm-6"><span class="text-bold">${this.tr.instant(
            'event.msg.NOT_SET_LIMIT'
          )}</span></div>`;
        }
      }
    });
    let itemizedDetails = Object.values(itemMap).join('');
    return `${description}${itemizedDetails}`;
  }

  renderMemoryOverusageMessage(msg) {
    const itemMap = {
      Percentage: '',
      SystemTotal: '',
      Usage: '',
      SystemFree: '',
    };
    Object.entries(msg).forEach(([k, v]) => {
      if (k === 'Percentage') {
        itemMap[
          k
        ] = `<div class="col-sm-6"><span class="text-bold">${this.tr.instant(
          `event.msg.${parseDivideStyle(k).toUpperCase()}`
        )}:</span>&nbsp;<span>${v}%</span></div>`;
      } else {
        itemMap[
          k
        ] = `<div class="col-sm-6"><span class="text-bold">${this.tr.instant(
          `event.msg.${parseDivideStyle(k).toUpperCase()}`
        )}:</span>&nbsp;<span>${this.bytesPipe.transform(
          v as any
        )}</span></div>`;
      }
    });
    return Object.values(itemMap).join('');
  }
}
