import { PathConstant } from '@common/constants/path.constant';

export function sendRequest(inputObj, apiUrl: string) {
  let domain = inputObj.domain;
  let query = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        self.postMessage(JSON.parse(xhttp.responseText));
      } else {
        self.postMessage({
          error: { status: this.status, data: this.responseText },
        });
      }
    }
  };
  xhttp.open('GET', apiUrl + query, true);
  xhttp.setRequestHeader('token', inputObj.token);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('Cache-Control', 'no-cache');
  xhttp.setRequestHeader('Pragma', 'no-cache');
  xhttp.send();
}

export const dashboardDetailsJob = () => {
  self.onmessage = (event: MessageEvent) => {
    // @ts-ignore
    let baseUrl = event.target!.origin;
    let inputObj = JSON.parse(event.data);
    if (inputObj.isSUSESSO) {
      baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${
        inputObj.neuvectorProxy
      }`;
    }
    let apiUrl = `${baseUrl}/${PathConstant.DASHBOARD_DETAILS_URL}`;
    sendRequest(inputObj, apiUrl);
  };
};
