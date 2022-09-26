import { Injectable } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { GlobalVariable } from '@common/variables/global.variable';

@Injectable()
export class GraphHttpService {
  deleteConversation(from: string, to: string) {
    return GlobalVariable.http.delete(PathConstant.CONVERSATION_SNAPSHOT_URL, {
      params: { from, to },
    });
  }
}
