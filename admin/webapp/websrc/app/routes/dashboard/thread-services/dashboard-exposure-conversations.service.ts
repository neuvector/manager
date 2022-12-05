import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { InternalSystemInfo } from '@common/types';

@Injectable()
export class DashboardExposureConversationsService {

  private worker;
  isLoadingExposureConversation: boolean = false;
  exposureConversationList: any[] = [];

  constructor() {}

  runWorker(isGlobalUser: boolean, scoreInfo: InternalSystemInfo) {
    if (this.worker) {
      this.worker.terminate();
    }
    this.createWorker(isGlobalUser, scoreInfo);
  }

  createWorker(isGlobalUser: boolean, scoreInfo: InternalSystemInfo) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./dashboard-exposure-conversations.worker.ts', import.meta.url)
      );
    }
    if (this.worker) {
      this.isLoadingExposureConversation = true;
      this.exposureConversationList = [];
      this.worker.postMessage(
        JSON.stringify({
          exposures: {
            ingress: scoreInfo.ingress,
            egress: scoreInfo.egress
          },
          currUrl: window.location.href,
          token: GlobalVariable.user?.token.token,
          isGlobalUser: isGlobalUser,
          isSUSESSO: GlobalVariable.isSUSESSO ? GlobalVariable.isSUSESSO : "",
          neuvectorProxy: GlobalConstant.PROXY_VALUE
        })
      );
      this.worker.onmessage = (message) => {
        this.isLoadingExposureConversation = false;
        this.exposureConversationList = message.data;
      };
    }
  }

  terminateWorker() {
    this.worker?.terminate();
  }
}
