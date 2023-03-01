import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-csp-license-config-modal',
  templateUrl: './csp-license-config-modal.component.html',
  styleUrls: ['./csp-license-config-modal.component.scss']
})
export class CspLicenseConfigModalComponent implements OnInit {

  downloading$ = new Subject();

  constructor(
    public dialogRef: MatDialogRef<CspLicenseConfigModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

  downloadSupportConfigFile = () => {
    
  };

}
