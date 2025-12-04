import { Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


type TemplateType = 'compliance' | 'scan' | 'admission' | '';
const TemplateTypes: TemplateType[] = ['compliance', 'scan', 'admission'];
interface AdmissionItem {
  title: string;
  value: string;
}

@Component({
  standalone: false,
  selector: 'app-risk-report-grid-message-cell',
  templateUrl: './risk-report-grid-message-cell.component.html',
  styleUrls: ['./risk-report-grid-message-cell.component.scss'],
  
})
export class RiskReportGridMessageCellComponent
  implements ICellRendererAngularComp
{
  params: any;
  templateType!: TemplateType;
  labelCode!: string;
  get displayHighVuls() {
    return this.params.data.high_vul_cnt > 5
      ? `${this.params.data.high_vuls.slice(0, 5).join(', ')}...`
      : this.params.data.high_vuls;
  }
  get displayMediumVuls() {
    return this.params.data.medium_vul_cnt > 5
      ? `${this.params.data.medium_vuls.slice(0, 5).join(', ')}...`
      : this.params.data.medium_vuls;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.templateType = this.getTemplateType(this.params.data.name);
    this.labelCode = MapConstant.colourMap[this.params.data.level];
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  getTemplateType(name: string) {
    for (let templateType of TemplateTypes) {
      if (name.toLowerCase().includes(templateType)) return templateType;
    }
    return '';
  }

  getAdmissionItems(items: string[]): AdmissionItem[] {
    let admissionItems: AdmissionItem[] = [];
    if (items) {
      items.forEach(item => {
        let indexOfColon = item.indexOf(':');
        let title = `audit.gridHeader.${item
          .substring(0, indexOfColon)
          .toUpperCase()}`;
        let value = item.substring(indexOfColon + 1);
        if (
          value.trim() &&
          item.substring(0, indexOfColon).toLowerCase() !== 'image'
        ) {
          admissionItems.push({ title, value });
        }
      });
    }
    return admissionItems;
  }
}
