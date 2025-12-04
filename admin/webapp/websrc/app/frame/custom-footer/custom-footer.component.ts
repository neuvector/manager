import { Component, OnInit } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '@services/auth.service';
import {
  getContrastRatio,
  isGoodContrastRatio,
} from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-custom-footer',
  templateUrl: './custom-footer.component.html',
  styleUrls: ['./custom-footer.component.scss'],
  
})
export class CustomFooterComponent implements OnInit {
  footerText: SafeHtml = '';
  footerStyle;
  private _environmentVariablesRetrievedSubscription;

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // add style="bottom: 28px;"
    // into <footer class="footer-container" style="bottom: 28px;" app-footer></footer>
    // in the sidebar.component.html
    const style = {
      height: '28px',
      position: 'fixed',
      bottom: '0',
      width: '100%',
      'z-index': '121',
      display: 'flex',
      'justify-content': 'center',
      'align-items': 'center',
    };

    if (GlobalVariable.customPageFooterContent) {
      this.footerText = this.sanitizer.bypassSecurityTrustHtml(
        GlobalVariable.customPageFooterContent
      );
    }

    if (GlobalVariable.customPageFooterColor) {
      this.footerStyle = {
        ...style,
        color: isGoodContrastRatio(
          getContrastRatio(GlobalVariable.customPageFooterColor, 'FFFFFF')
        )
          ? 'white'
          : 'black',
        'background-color': GlobalVariable.customPageFooterColor,
      };
    } else {
      this._environmentVariablesRetrievedSubscription =
        this.authService.onEnvironmentVariablesRetrieved$.subscribe(value => {
          if (GlobalVariable.customPageFooterContent) {
            this.footerText = this.sanitizer.bypassSecurityTrustHtml(
              GlobalVariable.customPageFooterContent
            );
          }
          if (GlobalVariable.customPageFooterColor) {
            this.footerStyle = {
              ...style,
              color: isGoodContrastRatio(
                getContrastRatio(GlobalVariable.customPageFooterColor, 'FFFFFF')
              )
                ? 'white'
                : 'black',
              'background-color': GlobalVariable.customPageFooterColor,
            };
          }
        });
    }
  }
}
