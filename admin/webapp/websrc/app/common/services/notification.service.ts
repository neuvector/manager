import { Injectable } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { GlobalConstant } from '@common/constants/global.constant';


@Injectable()
export class NotificationService {
  constructor(
    private notifier: NotifierService
  ) {}

  open(message: string, type: string = GlobalConstant.NOTIFICATION_TYPE.DEFAULT, id: string = ''): void {
    if (id) {
      this.notifier.notify(type, message, id);
    } else {
      this.notifier.notify(type, message);
    }
  }
}
