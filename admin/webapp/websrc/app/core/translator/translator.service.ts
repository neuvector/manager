import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class TranslatorService {
  private defaultLanguage = 'en';

  private availablelangs = [
    { code: 'en', text: 'English' },
    { code: 'zh_cn', text: '中文' },
  ];

  constructor(public translate: TranslateService) {
    // register supported languages
    this.translate.addLangs(this.availablelangs.map(lang => lang.code));

    // set the fallback language (replacement for setDefaultLang)
    this.translate.setFallbackLang(this.defaultLanguage);

    // activate the default/fallback language
    this.translate.use(this.defaultLanguage);
  }

  useLanguage(lang: string = '') {
    const fallback = this.translate.getFallbackLang() ?? this.defaultLanguage;
    const language = lang || fallback;
    this.translate.use(language);
  }

  getAvailableLanguages() {
    return this.availablelangs;
  }
}
