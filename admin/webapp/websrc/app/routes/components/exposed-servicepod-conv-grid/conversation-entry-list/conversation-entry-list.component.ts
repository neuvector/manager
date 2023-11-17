import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MapConstant } from '@common/constants/map.constant';
import { ConversationReportEntryByServce } from '@common/types';

@Component({
  selector: 'app-conversation-entry-list',
  templateUrl: './conversation-entry-list.component.html',
  styleUrls: ['./conversation-entry-list.component.scss']
})
export class ConversationEntryListComponent implements ICellRendererAngularComp {

  params: ICellRendererParams;
  colourMap: any = MapConstant.colourMap;
  conversationEntryList: Array<ConversationReportEntryByServce>


  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.conversationEntryList = this.params.data.entries;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

}
