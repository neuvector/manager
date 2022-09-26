import { PathConstant } from '@common/constants/path.constant';

export const dashboardSecurityEventsJob = () => {
  self.onmessage = (event) => {
    let baseUrl = event.srcElement.origin;
    let inputObj = JSON.parse(event.data);
    console.log("inputObj.isSUSESSO: ", inputObj.isSUSESSO);
    if (inputObj.isSUSESSO) {
      baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${inputObj.neuvectorProxy}`;
      console.log("Rewritten base url:", baseUrl);
    }
    let apiUrl = `${baseUrl}/${PathConstant.DASHBOARD_NOTIFICATIONS_URL}`;
    console.log("Notification API Url:", apiUrl);
    let domain = inputObj.domain;
    let query = domain ? `?domain=${encodeURIComponent(domain)}` : "";
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          self.postMessage(JSON.parse(xhttp.responseText));
        } else {
          self.postMessage({error: {status: this.status, data: this.responseText}});
        }
      }
    };
    xhttp.open("GET", apiUrl + query, true);
    xhttp.setRequestHeader("token", inputObj.token);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Cache-Control", "no-cache");
    xhttp.setRequestHeader("Pragma", "no-cache");
    xhttp.send();
  };
};
