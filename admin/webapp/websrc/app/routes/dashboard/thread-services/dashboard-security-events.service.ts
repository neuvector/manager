import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';

@Injectable()
export class DashboardSecurityEventsService {

  private worker;
  securityEventSummary: any;
  topSecurityEvents: any;

  constructor() {}

  runWorker() {
    if (this.worker) {
      this.worker.terminate();
      console.info('killed an existing running worker (dashboard-security-events)...');
    }
    this.createWorker();
  }

  createWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./dashboard-security-events.worker.ts', import.meta.url)
      );
    }
    if (this.worker) {
      console.log('Post message to worker (dashboard-security-events)');
      this.worker.postMessage(
        JSON.stringify({
          token: GlobalVariable.user?.token.token,
          currUrl: window.location.href,
          isSUSESSO: GlobalVariable.isSUSESSO ? GlobalVariable.isSUSESSO : "",
          neuvectorProxy: GlobalConstant.PROXY_VALUE
        })
      );
      this.worker.onmessage = (message) => {
        console.log('message =', message);
        this.securityEventSummary = message.data.criticalSecurityEvents.summary;
        this.topSecurityEvents = message.data.criticalSecurityEvents.top_security_events
      };
    }
  }

  terminateWorker() {
    this.worker?.terminate();
  }
}
