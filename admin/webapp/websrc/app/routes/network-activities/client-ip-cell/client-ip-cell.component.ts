import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';

@Component({
  selector: 'app-client-ip-cell',
  templateUrl: './client-ip-cell.component.html',
  styleUrls: ['./client-ip-cell.component.scss']
})
export class ClientIpCellComponent implements ICellRendererAngularComp {

  params!: ICellRendererParams;
  countryFlagIcon: string;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.countryFlagIcon = getUnicodeFlagIcon(params.data.client_ip_location.country_code === '-' ? '--' : params.data.client_ip_location.country_code);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

}
