import { PathConstant } from '@common/constants/path.constant';
import {sendRequest} from "@routes/dashboard/thread-services/dashboard-details-job";

export const dashboardSecurityEventsJob = () => {
  self.onmessage = (event) => {
    // @ts-ignore
    let baseUrl = event.target!.origin;
    let inputObj = JSON.parse(event.data);
    if (inputObj.isSUSESSO) {
      baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${inputObj.neuvectorProxy}`;
    }
    let apiUrl = `${baseUrl}/${PathConstant.DASHBOARD_NOTIFICATIONS_URL}`;
    sendRequest(inputObj, apiUrl)
  };
};
