import { PathConstant } from '@common/constants/path.constant';

export const dashboardExposureConversationsJob = () => {
  self.onmessage = (event) => {
    // @ts-ignore
    let baseUrl = event.target!.origin;
    let inputObj = JSON.parse(event.data);
    if (inputObj.isSUSESSO) {
      baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${inputObj.neuvectorProxy}`;
    }
    let apiUrl = `${baseUrl}/${PathConstant.CONVERSATION_HISTORY_URL}`;
    let isGlobalUser = inputObj.isGlobalUser;
    let exposures = inputObj.exposures;
    let exposureList: Array<any> = [];
    let accExposureCnt = 0;

    const getConversationHistory = function(query, total, type) {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) {
            exposureList.push(Object.assign({
              type: type
            }, JSON.parse(xhttp.responseText).conversation));
            if (accExposureCnt === total - 1) {
              self.postMessage(exposureList);
            }
          } else {
            self.postMessage({error: {status: this.status, data: this.responseText}});
          }
          accExposureCnt++;
        }
      };
      xhttp.open("GET", apiUrl + query, true);
      xhttp.setRequestHeader("token", inputObj.token);
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.setRequestHeader("Cache-Control", "no-cache");
      xhttp.setRequestHeader("Pragma", "no-cache");
      xhttp.send();
    };

    exposures.ingress.forEach(ingress => {
      let query = `?from=external&to=${ingress.id}`;
      getConversationHistory(query, exposures.ingress.length + exposures.egress.length, "ingress");
    });

    exposures.egress.forEach(egress => {
      let query = `?from=${egress.id}&to=external`;
      getConversationHistory(query, exposures.ingress.length + exposures.egress.length, "egress");
    });
  };
};
