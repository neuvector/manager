import { Injectable } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from  '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';


@Injectable()
export class NotificationService {
  constructor(
    private notifier: NotifierService,
    private utils: UtilsService,
    private translate: TranslateService
  ) {}

  open = (message: string, type: string = GlobalConstant.NOTIFICATION_TYPE.SUCCESS, id: string = ''): void => {
    if (id) {
      this.notifier.notify(type, message, id);
    } else {
      this.notifier.notify(type, message);
    }
  }

  openError = (error, errorTitle: string, id: string = ''): void => {
    if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
      this.open(
        this.utils.getAlertifyMsg(error, errorTitle, false),
        GlobalConstant.NOTIFICATION_TYPE.ERROR
      );
    }
  }

  openHtmlError = (messageHtmlStr, htmlTemplate, id=''): void => {
    console.log(messageHtmlStr, htmlTemplate)
    this.notifier.show({
       message: messageHtmlStr,
       type: GlobalConstant.NOTIFICATION_TYPE.ERROR,
       template: htmlTemplate
    });
  };
}
