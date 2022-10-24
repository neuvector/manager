import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { GlobalVariable } from '@common/variables/global.variable';

@Injectable()
export class CommonHttpService {
  getVersion() {
    return GlobalVariable.http.get(PathConstant.MGR_VERSION, {
      responseType: 'text',
    });
  }
}
