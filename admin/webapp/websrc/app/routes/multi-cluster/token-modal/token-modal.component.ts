import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-token-modal",
  templateUrl: "./token-modal.component.html",
  styleUrls: ["./token-modal.component.scss"]
})
export class TokenModalComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<TokenModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = false;
  }

  ngOnInit() {}

  onCancel = () => {
    this.dialogRef.close();
  };
}
