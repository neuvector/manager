import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GlobalVariable } from '@common/variables/global.variable';
import { AuthService } from '@services/auth.service';
import {
  getContrastRatio,
  isGoodContrastRatio,
} from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
})
export class CustomHeaderComponent implements OnInit, OnDestroy {
  headerText: SafeHtml = '';
  headerStyle;
  private _environmentVariablesRetrievedSubscription;

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // add style="margin-top: 97px;"
    // to <main class="section-container" id="main-content">
    // in frame.component.html
    const style = {
      height: '28px',
      display: 'flex',
      'justify-content': 'center',
      'align-items': 'center',
    };

    if (GlobalVariable.customPageHeaderContent) {
      this.headerText = this.sanitizer.bypassSecurityTrustHtml(
        GlobalVariable.customPageHeaderContent
      );
    }

    if (GlobalVariable.customPageHeaderColor) {
      this.headerStyle = {
        ...style,
        color: isGoodContrastRatio(
          getContrastRatio(GlobalVariable.customPageHeaderColor, 'FFFFFF')
        )
          ? 'white'
          : 'black',
        'background-color': GlobalVariable.customPageHeaderColor,
      };
    } else {
      this._environmentVariablesRetrievedSubscription =
        this.authService.onEnvironmentVariablesRetrieved$.subscribe(value => {
          if (GlobalVariable.customPageHeaderContent) {
            this.headerText = this.sanitizer.bypassSecurityTrustHtml(
              GlobalVariable.customPageHeaderContent
            );
          }

          if (GlobalVariable.customPageHeaderColor) {
            this.headerStyle = {
              ...style,
              color: isGoodContrastRatio(
                getContrastRatio(GlobalVariable.customPageHeaderColor, 'FFFFFF')
              )
                ? 'white'
                : 'black',
              'background-color': GlobalVariable.customPageHeaderColor,
            };
          }
        });
    }
  }

  ngOnDestroy() {
    if (this._environmentVariablesRetrievedSubscription) {
      this._environmentVariablesRetrievedSubscription.unsubscribe();
    }
  }
}
