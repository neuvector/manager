import { Injectable } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { ConfigHttpService } from '@common/api/config-http.service';
import { Webhook } from '@common/types';

@Injectable()
export class FederatedConfigurationService {
  public activeTabIndex4Group: number = 0;
  constructor(private configHttpService: ConfigHttpService) {}

  getFederatedConfig() {
    return this.configHttpService.getFedConfig();
  }

  addWebhook(payload: Webhook) {
    return GlobalVariable.http.post(PathConstant.WEBHOOK, payload, {
      params: { scope: 'fed' },
    });
  }

  deleteWebhook(name: string) {
    return GlobalVariable.http.delete(PathConstant.WEBHOOK, {
      params: { name: name, scope: 'fed' },
    });
  }

  patchWebhook(payload: Webhook) {
    return GlobalVariable.http.patch(PathConstant.WEBHOOK, payload, {
      params: { scope: 'fed' },
    });
  }
}
