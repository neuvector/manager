import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { InternalSystemInfo } from '@common/types';

@Injectable()
export class DashboardExposureConversationsService {

  private worker;

  constructor() {}

  runWorker(isGlobalUser: boolean, scoreInfo: InternalSystemInfo) {
    if (this.worker) {
      this.worker.terminate();
      console.info('killed an existing running worker (dashboard-exposure-conversations)...');
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
      console.log('Post message to worker (dashboard-exposure-conversations)');
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
        console.log('message =', message);
      };
    }
  }

  terminateWorker() {
    this.worker?.terminate();
  }
}
