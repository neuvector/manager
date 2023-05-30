import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslatorService {
  private defaultLanguage: string = 'en';

  private availablelangs = [
    { code: 'en', text: 'English' },
    { code: 'zh_cn', text: '中文' },
  ];

  constructor(public translate: TranslateService) {
    this.setDefaultLang();
  }

  private setDefaultLang() {
    this.translate.addLangs(this.availablelangs.map(lang => lang.code));
    this.translate.setDefaultLang(this.defaultLanguage);
  }

  useLanguage(lang: string = '') {
    this.translate.use(lang || this.translate.getDefaultLang());
  }

  getAvailableLanguages() {
    return this.availablelangs;
  }
}
