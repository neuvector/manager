import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AgreementComponent } from '@routes/pages/login/eula/agreement/agreement.component';
import { GlobalVariable } from '@common/variables/global.variable';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'app-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
})
export class EulaComponent implements OnInit {
  public eulaPrompt: SafeHtml = '';
  public eulaPromptText: SafeHtml = '';
  public eulaPromptLink: SafeHtml = '';

  @Output() eulaStatus = new EventEmitter<boolean>();

  constructor(private dialog: MatDialog,
              private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.eulaPrompt = GlobalVariable.customEULAPrompt;

    if (GlobalVariable.customEULAPrompt) {
      const regex = /<a>(.*?)<\/a>/;
      const match = GlobalVariable.customEULAPrompt.match(regex);
      const anchorText = match ? match[1] : '';
      const promptText = GlobalVariable.customEULAPrompt.replace(regex, '');
      if(promptText){
        this.eulaPrompt = this.sanitizer.bypassSecurityTrustHtml(promptText);
      }
      if(anchorText){
        this.eulaPromptLink = this.sanitizer.bypassSecurityTrustHtml(anchorText);
      }
    }
  }

  openEULAPage() {
    this.dialog.open(AgreementComponent, {
      data: { isFromSSO: false },
      width: '80vw',
      height: '685px',
    });
  }

  onCheck(isChecked: boolean) {
    this.eulaStatus.emit(isChecked);
  }
}
