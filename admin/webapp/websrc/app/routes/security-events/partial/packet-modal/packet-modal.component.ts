import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { saveAs } from 'file-saver';
import { decode } from '@common/utils/common.utils';
import { UtilsService } from '@common/utils/app.utils';


@Component({
  standalone: false,
  selector: 'app-packet-modal',
  templateUrl: './packet-modal.component.html',
  styleUrls: ['./packet-modal.component.scss'],
  
})
export class PacketModalComponent implements OnInit {
  hasPacketErr: boolean = false;
  hexItems: Array<any>;
  chars: Array<any>;
  positions: Array<any>;
  current: number;
  offset: number;
  cols: number;
  decodedPacket: any;

  constructor(
    public dialogRef: MatDialogRef<PacketModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.preprocessPacketData();
  }

  preprocessPacketData = () => {
    this.hexItems = [];
    this.chars = [];
    this.positions = [];
    this.decodedPacket = decode(this.data.packet);
    if (this.data.packet.length > 0) {
      for (let i in this.decodedPacket) {
        this.hexItems.push(this._toHex(this.decodedPacket[i], 2));
        this.chars.push(this._toChar(this.decodedPacket[i]));
      }
      this.offset = this.current = 0;
      this.cols = Math.ceil(this.decodedPacket.length / 16);
      for (let i = 0; i < this.cols; i += 1) {
        this.positions.push(this._toHex(this.offset + i * 16, 8));
      }
    }
  };

  exportPcap = () => {
    let pcap = this.decodedPacket;

    let blockHeader = new Uint32Array(8);
    //Dummy block header
    blockHeader[0] = 0xa1b2c3d4;
    blockHeader[1] = 0x00040002;
    blockHeader[2] = 0x00000000;
    blockHeader[3] = 0x00000000;
    blockHeader[4] = 0x0000ffff;
    blockHeader[5] = 0x00000001;
    blockHeader[6] = 0x4f6ebc6b;
    blockHeader[7] = 0x00069967;

    let lengthHex = Number(this.decodedPacket.length)
      .toString(16)
      .padStart(8, '0');
    let lengthHesSection = lengthHex.match(/.{1,2}/g)!.reverse();
    let sectionLen = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      sectionLen[i] = parseInt(lengthHesSection[i], 16);
    }

    let blob = new Blob([blockHeader, sectionLen, sectionLen, pcap], {
      type: 'application/octet-stream',
    });
    saveAs(blob, `packet_${this.utils.parseDatetimeStr(new Date())}.pcap`);
  };

  setCurrent = index => {
    this.current = index;
  };

  private _toHex = function (number, length: number) {
    let s = number.toString(16).toUpperCase();
    while (s.length < length) {
      s = '0' + s;
    }
    return s;
  };

  private _toChar = function (number) {
    return number <= 32 ? ' ' : String.fromCharCode(number);
  };
}
