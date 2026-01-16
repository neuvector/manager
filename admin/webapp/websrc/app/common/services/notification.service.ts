import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { HttpClient } from '@angular/common/http';
import { PathConstant } from '@common/constants/path.constant';
import { GlobalNotificationPayLoad } from '@common/types';
import { Observable } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(
    private toastr: ToastrService,
    private utils: UtilsService,
    private http: HttpClient
  ) {}

  open = (
    message: string,
    type: string = GlobalConstant.NOTIFICATION_TYPE.SUCCESS,
    title: string = ''
  ): void => {
    if (title) {
      this.toastr[type](message, title, {timeOut: 8000, closeButton: true});
    } else {
      this.toastr[type](message, null, {timeOut: 8000, closeButton: true});
    }
  };

  openError = (error, errorTitle: string, id: string = ''): void => {
    if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
      this.open(
        this.utils.getAlertifyMsg(error, errorTitle, false),
        GlobalConstant.NOTIFICATION_TYPE.ERROR
      );
    }
  };

  acceptNotification(payload: GlobalNotificationPayLoad): Observable<any> {
    return this.http.post(PathConstant.NOTIFICATION_PERSIST_URL, payload);
  }
}
