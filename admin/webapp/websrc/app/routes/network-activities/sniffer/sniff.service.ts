import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { GlobalVariable } from "@common/variables/global.variable";
import { UtilsService } from "@common/utils/app.utils";
import {GetRowIdParams, GridOptions} from "ag-grid-community";
import * as $ from "jquery";
import * as moment from "moment";
import { PathConstant } from "@common/constants/path.constant";
import { BytesPipe } from "@common/pipes/app.pipes";

@Injectable()
export class SniffService {
  private _snifferGridOptions: GridOptions = <GridOptions>{};
  private readonly $win;

  constructor(
    private bytesPipe: BytesPipe,
    private utils: UtilsService,
    private http: HttpClient,
    private translate: TranslateService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  get snifferGridOptions(): GridOptions {
    return this._snifferGridOptions;
  }

  prepareSnifferColumns = () => {
    const sniffColumns = [
      {
        headerName: this.translate.instant("network.gridHeader.START_TIME"),
        field: "start_time",
        cellRenderer: params =>
          moment(params.value * 1000).format("MM/DD/Y HH:mm:ss"),
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>'
        },
        minWidth: 160,
        maxWidth: 170
      },
      {
        headerName: this.translate.instant("containers.process.STATUS"),
        field: "status"
      },
      {
        headerName: this.translate.instant("network.gridHeader.FILE_SIZE"),
        field: "size",
        valueFormatter: params => this.bytesPipe.transform(params.value),
        cellClass: 'grid-right-align',
        cellRenderer: 'agAnimateShowChangeCellRenderer',
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
      },
      {
        headerName: this.translate.instant("network.gridHeader.STOP_TIME"),
        field: "stop_time",
        cellRenderer: params => {
          if (params.value > 0)
            return moment(params.value * 1000).format("MM/DD/Y HH:mm:ss");
          else return "";
        },
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>'
        },
        minWidth: 160,
        maxWidth: 170
      }
    ];
    this._snifferGridOptions = this.utils.createGridOptions(
      sniffColumns,
      this.$win
    );
    this._snifferGridOptions.getRowId = (params: GetRowIdParams) => {
      return params.data.id;
    };
  };

  getSniffers = (containerId: string) =>
    this.http
      .get(PathConstant.SNIFF_URL, { params: { id: containerId } })
      .pipe();

  startSniff = (containerId: string, snifferParam) =>
    this.http
      .post(PathConstant.SNIFF_URL, {
        workloadId: containerId,
        snifferParamWarp: {
            sniffer: snifferParam
        }
      })
      .pipe();

  stopSniff = (jobId: string) =>
    this.http.patch(PathConstant.SNIFF_URL, jobId).pipe();

  deleteSniff = (jobId: string) =>
    this.http.delete(PathConstant.SNIFF_URL, { params: { id: jobId } }).pipe();

  downloadPacket = (jobId: string) =>
    this.http
      .get<HttpResponse<Object>>(PathConstant.SNIFF_PCAP_URL, {
        params: { id: jobId },
        responseType: "arraybuffer" as "json",
        observe: 'response',
        headers: { "Cache-Control": "no-store" }
      })
      .pipe();

  multiPart_parse(body, contentType) {
    let m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

    if (!m) {
      throw new Error("Bad content-type header, no multipart boundary");
    }

    let boundary = m[1] || m[2];

    const Header_parse = header => {
      let headerFields: { name: any } = { name: "" };
      let matchResult = header.match(/^.*name="([^"]*)"$/);
      if (matchResult) headerFields.name = matchResult[1];
      return headerFields;
    };

    const rawStringToBuffer = str => {
      let idx,
        len = str.length,
        arr = new Array(len);
      for (idx = 0; idx < len; ++idx) {
        arr[idx] = str.charCodeAt(idx) & 0xff;
      }
      return new Uint8Array(arr).buffer;
    };

    boundary = "\r\n--" + boundary;
    let isRaw = typeof body !== "string";
    let s;
    if (isRaw) {
      let view = new Uint8Array(body);
      s = view.reduce(function(data, byte) {
        return data + String.fromCharCode(byte);
      }, "");
    } else {
      s = body;
    }

    s = "\r\n" + s;

    let parts = s.split(new RegExp(boundary)),
      partsByName = {};

    let fieldName: string = '';

    let exportFilename: string = "";
    for (let i = 1; i < parts.length - 1; i++) {
      let subParts = parts[i].split("\r\n\r\n");
      let headers = subParts[0].split("\r\n");
      for (let j = 1; j < headers.length; j++) {
        let headerFields = Header_parse(headers[j]);
        if (headerFields.name) {
          fieldName = headerFields.name;
        }
      }

      partsByName[fieldName] = isRaw
        ? rawStringToBuffer(subParts.slice(1).join("\r\n\r\n"))
        : subParts.slice(1).join("\r\n\r\n");
      exportFilename = fieldName;
    }
    return { filename: exportFilename, parts: partsByName };
  }
}
