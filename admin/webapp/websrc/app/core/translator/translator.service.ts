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
    if (!translate.getDefaultLang())
      translate.setDefaultLang(this.defaultLanguage);

    this.useLanguage();
  }

  useLanguage(lang: string = '') {
    this.translate.use(lang || this.translate.getDefaultLang());
  }

  getAvailableLanguages() {
    return this.availablelangs;
  }
}
