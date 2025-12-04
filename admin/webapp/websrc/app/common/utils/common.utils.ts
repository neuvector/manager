import { GlobalConstant } from '../constants/global.constant';
import { MapConstant } from '../constants/map.constant';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Exposure,
  Group,
  HierarchicalExposure,
  IdName,
  Service,
  Vulnerability,
  Workload,
  WorkloadChildV2,
  DataOps,
  WorkloadV2,
  ConversationReportEntryByService,
} from '@common/types';
import { WorkloadBrief } from '@common/types/compliance/workloadBrief';
import { GridApi, GridOptions } from 'ag-grid-community';

let _keyStr: string =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

let topBar: number = 65;
let sectionPadding: number = 20 * 2;
let verticalPadding: number = 15 * 2;
let header: number = 53;
let title: number = 40;
let marginInBoxes: number = 18;
let CALENDAR: any = {
  YEARS: 'years',
  MONTHS: 'months',
  DAYS: 'days',
  HOURS: 'hours',
  MINUTES: 'minutes',
  SECONDS: 'seconds',
};

export const FEED_RATING_SORT_ORDER = [
  'untriaged',
  'not yet assigned',
  'end-of-life',
  'negligible',
  'unimportant',
  'low',
  'medium',
  'moderate',
  'high',
  'important',
  'critical',
];

export const uuid = () => uuidv4();

export function toBoolean(value: string) {
  switch (value.toLowerCase()) {
    case 'true':
    case '1':
    case 'on':
    case 'yes':
      return true;
    default:
      return false;
  }
}

export function arrayToCsv(array: any, title: string = '') {
  let line: string = '';
  let result: string = '';
  let columns: string[] = [];
  if (!Array.isArray(array) || array.length === 0) return result;
  if (title.length > 0) {
    result += title + '\r\n';
  }
  let i: number = 0;
  for (let key in array[0]) {
    let keyString = key + ',';
    columns[i] = key;
    line += keyString;
    i++;
  }

  line = line.slice(0, -1);
  result += line + '\r\n';

  for (let i = 0; i < array.length; i++) {
    let line = '';

    for (let j = 0; j < columns.length; j++) {
      let value = array[i][columns[j]];
      if (value === undefined || value === null) value = '';
      line += `"${value}"` + ',';
    }

    line = line.slice(0, -1);
    result += line + '\r\n';
  }
  return result;
}

export function _groupBy(array, key) {
  return array.reduce(function (res, elem) {
    (res[elem[key]] = res[elem[key]] || []).push(elem);
    return res;
  }, {});
}

export function groupBy<T, K extends keyof T>(arr: T[], key: string) {
  return arr.reduce((groups, item) => {
    (groups[item[key]] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

export function getEndPointType(name) {
  if (name) {
    if (name.indexOf('Host:') === 0)
      return '<em class="fa fa-server text-primary mr-sm"></em>';
    else if (name.indexOf('Workload:') === 0)
      return '<em class="fa fa-square text-primary mr-sm"></em>';
    else if (name.indexOf('external') === 0)
      return '<em class="fa fa-cloud text-primary mr-sm"></em>';
    else if (name.indexOf('IP-Group:') === 0)
      return '<em class="fa fa-th-large text-primary mr-sm"></em>';
    else return '<em class="fa fa-square-o text-primary mr-sm"></em>';
  }
  return '';
}

export function removePaddingChars(input) {
  let lkey = _keyStr.indexOf(input.charAt(input.length - 1));
  if (lkey === 64) {
    return input.substring(0, input.length - 1);
  }
  return input;
}

export function decode(input, arrayBuffer: ArrayBuffer | null = null) {
  //get last chars to see if are valid
  input = removePaddingChars(input);
  input = removePaddingChars(input);

  let bytes = (input.length / 4) * 3;

  let uarray;
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;
  let j = 0;

  if (arrayBuffer) uarray = new Uint8Array(arrayBuffer);
  else uarray = new Uint8Array(bytes);

  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  for (i = 0; i < bytes; i += 3) {
    //get the 3 octets in 4 ascii chars
    enc1 = _keyStr.indexOf(input.charAt(j++));
    enc2 = _keyStr.indexOf(input.charAt(j++));
    enc3 = _keyStr.indexOf(input.charAt(j++));
    enc4 = _keyStr.indexOf(input.charAt(j++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    uarray[i] = chr1;
    if (enc3 !== 64) uarray[i + 1] = chr2;
    if (enc4 !== 64) uarray[i + 2] = chr3;
  }

  return uarray;
}

export function decodeArrayBuffer(input) {
  let bytes = (input.length / 4) * 3;
  let ab = new ArrayBuffer(bytes);
  decode(input, ab);

  return ab;
}

export function numericTextInputOnly(evt, withDec: boolean = true) {
  let event = evt || window.event;
  // event.persist();
  let key = event.keyCode || event.which;
  let isRemoving = key === 8;
  key = String.fromCharCode(key);
  let regex = withDec ? /[0-9]|\./ : /[0-9]/;
  if (!regex.test(key) && !isRemoving) {
    event.returnValue = false;
    if (event.preventDefault) event.preventDefault();
    return false;
  } else {
    return true;
  }
}

export function validTypingOnly(evt, pattern) {
  let event = evt || window.event;
  // event.persist();
  if (!pattern.test(event.key)) {
    event.returnValue = false;
    if (event.preventDefault) event.preventDefault();
    return false;
  } else {
    return true;
  }
}

export function threeWayMerge(arr1, arr2, arr3, comparer, target) {
  let params = [arr1, arr2, arr3];
  params.sort(function (a, b) {
    if (a.length && b.length && a[0][comparer] > b[0][comparer]) {
      return 1;
    } else if (a.length && b.length && a[0][comparer] < b[0][comparer]) {
      return -1;
    } else if (!a.length || !b.length) {
      return 1;
    } else {
      return 0;
    }
  });
  arr1 = params[0];
  arr2 = params[1];
  arr3 = params[2];

  let p1 = 0;
  let p2 = 0;
  let p3 = 0;
  let res: any[] = [];
  let end1 = arr1.length;
  let end2 = arr2.length;
  let end3 = arr3.length;

  while (p1 < end1 && p2 < end2 && p3 < end3) {
    if (arr1[p1][comparer] < arr2[p2][comparer]) {
      if (arr1[p1][comparer] < arr3[p3][comparer]) {
        res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
      } else {
        res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
      }
    } else {
      if (arr2[p2][comparer] < arr3[p3][comparer]) {
        res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
      } else {
        res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
      }
    }
  }
  while (p1 < end1 && p2 < end2) {
    if (arr1[p1][comparer] < arr2[p2][comparer]) {
      res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
    } else {
      res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
    }
  }
  while (p2 < end2 && p3 < end3) {
    if (arr2[p2][comparer] < arr3[p3][comparer]) {
      res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
    } else {
      res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
    }
  }
  while (p1 < end1 && p3 < end3) {
    if (arr1[p1][comparer] < arr3[p3][comparer]) {
      res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
    } else {
      res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
    }
  }
  while (p1 < end1) {
    res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
  }
  while (p2 < end2) {
    res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
  }
  while (p3 < end3) {
    res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
  }
  return res.filter((value, index, self) => self.indexOf(value) === index);
}

export function getDisplayName(originalName) {
  if (originalName) {
    const kube = 'k8s';
    let nameSec = originalName.split('_');
    if (nameSec[0] === kube) {
      return nameSec[2];
    } else {
      return originalName;
    }
  }
  return '';
}

export function truncateString(str, num) {
  if (str.length > num && num >= 3) {
    return str.slice(0, num - 3) + '...';
  }

  if (str.length > num && num <= 3) {
    return str.slice(0, num) + '...';
  } else {
    return str.slice(0);
  }
}

export function stringToColour(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = '';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

export function isAuthorized(userRoles, resource) {
  let max = 0;
  for (let roleType in userRoles) {
    if (userRoles[roleType] >= resource[roleType]) {
      return true;
    }
    //Temporary for 2.0.0 which is without namespace level details of authorization
    if (resource.namespace && roleType !== 'global') {
      max = Math.max(parseInt(userRoles[roleType], 10), max);
      if (max >= resource.namespace) {
        return true;
      }
    }
  }
  return false;
}

export function restrictLength4Autocomplete(str, maxLength) {
  if (typeof str === 'string') {
    return str.substring(0, maxLength);
  }
  return '';
}

export function parseRole(role) {
  switch (role) {
    case 'fedAdmin':
      return role;
    case 'admin':
      return role;
    case 'reader':
      return role;
    case 'ciops':
      return role;
    case '':
      return 'none';
    default:
      return role;
  }
}

export function parseLocalDate(datetime) {
  return datetime.split('T')[0].replace(/-/g, '');
}

export function capitalizeWord(word) {
  return `${word.charAt(0).toUpperCase()}${word.substring(1)}`;
}

export function parseCamelStyle(str, divider = '_', isCapitalInit = true) {
  return str
    .split(divider)
    .map((elem, index) => {
      return !isCapitalInit && index === 0 ? elem : capitalizeWord(elem);
    })
    .join('');
}

export function isUpperCase(letter) {
  return letter === letter.toUpperCase();
}

export function parseDivideStyle(str, divider = '_') {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1' + divider + '$2').toLowerCase();
}

export function shortenString(str, limit) {
  if (str.length > limit) {
    return `${str.substring(0, limit - 3)}...${str.substring(
      str.length - 3,
      str.length
    )}`;
  }
  return str;
}

export function shorten(str, len) {
  return str.length > len ? str.substring(0, len) : str;
}

export function renameKey(
  obj: any,
  old_key: string,
  new_key: string,
  _this: any
) {
  if (old_key !== new_key) {
    Object.defineProperty(
      obj,
      new_key,
      Object.getOwnPropertyDescriptor(obj, old_key) || _this
    );
    delete obj[old_key];
  }
}

export function isEmptyObj(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function setRisks(risks, workloadMap) {
  return risks.map(risk => {
    if (risk.workloads.length || risk.images.length) {
      let domains = new Set(),
        services = new Set();
      if (risk.workloads.length) {
        risk.workloads.forEach(workload => {
          const theWorkload = workloadMap.get(workload.id);
          if (theWorkload && theWorkload.domain) {
            domains.add(theWorkload.domain);
            workload.domain = theWorkload.domain;
          }
          if (theWorkload && theWorkload.service_group.substring(3)) {
            services.add(theWorkload.service_group.substring(3));
            workload.service = theWorkload.service_group.substring(3);
          }
          if (theWorkload && theWorkload.image) {
            workload.image = theWorkload.image;
          }
        });
      }
      if (risk.images.length) {
        risk.images.forEach(image => {
          if (Array.isArray(image.domains) && image.domains.length > 0) {
            image.domains.forEach(domain => domains.add(domain));
          }
        });
      }
      risk.domains = Array.from(domains);
      risk.services = Array.from(services);
      return risk;
    } else {
      risk.domains = [];
      risk.services = [];
      return risk;
    }
  });
}

export function onHover(points, evt) {
  if (points.length === 0) {
    evt.toElement.attributes.style.nodeValue =
      evt.toElement.attributes.style.nodeValue.replace('cursor: pointer;', '');
    return;
  }
  let res = evt.toElement.attributes.style.nodeValue.match(/cursor: pointer;/);
  if (res === null) {
    evt.toElement.attributes.style.nodeValue += 'cursor: pointer;';
  }
}

export function createFilter(query) {
  let lowercaseQuery = query.toLowerCase();
  return function filterFn(criteria) {
    return criteria.toLowerCase().indexOf(lowercaseQuery) >= 0;
  };
}

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function numberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function removeLeadingZero(str, exceptZero = false) {
  if (str && str.length > 0 && str !== '0') {
    return str.replace(/^[0]+/g, '');
  } else if (!exceptZero) {
    return str;
  }
}

export function validateUrl(url) {
  const pattern = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  );
  return pattern.test(url);
}

export function validateObjName(name) {
  const pattern = new RegExp(/^[a-zA-Z0-9]+[.:a-zA-Z0-9_-]*$/);
  return pattern.test(name);
}

export function dragElement(elmnt) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + 'Header')) {
    let headerElem = document.getElementById(
      elmnt.id + 'Header'
    ) as HTMLVideoElement;
    headerElem.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
    elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
  }
}

export function closeDragElement() {
  document.onmouseup = null;
  document.onmousemove = null;
}

export function getScope(source) {
  return source === GlobalConstant.NAV_SOURCE.FED_POLICY
    ? GlobalConstant.SCOPE.FED
    : GlobalConstant.SCOPE.LOCAL;
}

export function getCfgType(scope) {
  switch (scope) {
    case GlobalConstant.SCOPE.FED:
      return GlobalConstant.CFG_TYPE.FED;
    case GlobalConstant.SCOPE.LOCAL:
      return GlobalConstant.CFG_TYPE.CUSTOMER;
    default:
      return GlobalConstant.CFG_TYPE.CUSTOMER;
  }
}

export function getEntityName(count, entityName) {
  return count > 1
    ? entityName
    : MapConstant.singularMap[entityName]
    ? MapConstant.singularMap[entityName]
    : entityName;
}

export function getDuration(date1, date2) {
  //date format: "yyyymmdd"
  let a = moment([
    parseInt(date1.substring(0, 4), 10),
    parseInt(date1.substring(4, 6), 10) - 1,
    parseInt(date1.substring(6, 8), 10),
  ]);
  let b = moment([
    parseInt(date2.substring(0, 4), 10),
    parseInt(date2.substring(4, 6), 10) - 1,
    parseInt(date2.substring(6, 8), 10),
  ]);
  return a.diff(b, 'days');
}

export function getMessageFromItemError(message) {
  let indexOfErrorBody = message.indexOf('{');
  let errorBodyStr = message.substring(indexOfErrorBody);
  let errorBodyObj = JSON.parse(errorBodyStr);
  return errorBodyObj.error || errorBodyObj.message;
}

export function removeGroupExceptions(groups, policyType) {
  let groupExceptions = MapConstant.KIND_EXCEPTION_MAP[policyType];
  groupExceptions.forEach(groupException => {
    let index = groups.indexOf(groupException);
    if (index >= 0) groups.splice(index, 1);
  });
  return groups;
}

export function validateIPAddress(ip: string) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip
  );
}

export function isVulAccepted(vulnerability: Vulnerability) {
  return !!(
    vulnerability.tags && vulnerability.tags.some(tag => tag === 'accepted')
  );
}

export const sortByDisplayName = (a: IdName, b: IdName) => {
  const name_a = a.display_name.toLowerCase();
  const name_b = b.display_name.toLowerCase();
  if (name_a === name_b) return 0;
  return name_a > name_b ? 1 : -1;
};

export function briefToV2(workload: WorkloadBrief): WorkloadChildV2 {
  return {
    brief: {
      author: workload.author || '',
      display_name: workload.display_name || '',
      domain: workload.domain || '',
      id: workload.id || '',
      image: workload.image || '',
      image_id: workload.image_id || '',
      image_created_at: workload.image_created_at || '',
      image_reg_scanned: workload.image_reg_scanned || false,
      name: workload.name || '',
      service: workload.service || '',
      service_group: workload.service_group || '',
      state: workload.state || '',
    },
    platform_role: workload.platform_role || '',
    rt_attributes: {
      pod_name: workload.pod_name || '',
      privileged: workload.privileged || false,
      run_as_root: workload.run_as_root || false,
    },
    security: {
      cap_change_mode: workload.cap_change_mode || false,
      cap_quarantine: workload.cap_quarantine || false,
      cap_sniff: workload.cap_sniff || false,
      policy_mode: workload.policy_mode || '',
      scan_summary: workload.scan_summary,
      service_mesh: workload.service_mesh || false,
      service_mesh_sidecar: workload.service_mesh_sidecar || false,
    },
  };
}

export const parseExposureHierarchicalData = (
  exposure: Exposure[]
): HierarchicalExposure[] => {
  let hierarchicalExposures: any = [];
  if (exposure.length === 0) return hierarchicalExposures;
  let groupedExposure = groupBy(exposure, 'service');

  Object.entries(groupedExposure).forEach(([k, v]) => {
    let applicationSet = new Set<string>();
    let total_high_vuls_by_service = 0;
    let total_medium_vuls_by_service = 0;
    v.forEach(child => {
      if (child.applications) {
        child.applications.forEach(app => {
          applicationSet.add(app);
        });
      }
      if (child.ports) {
        child.ports.forEach(port => {
          applicationSet.add(port as any);
        });
      }
      total_high_vuls_by_service += child.high;
      total_medium_vuls_by_service += child.medium;
    });
    let hierarchicalExposure: HierarchicalExposure = {
      workload_id: '',
      peerEndpoint: '',
      service: k,
      policy_mode: v[0].policy_mode,
      workload: '',
      bytes: 0,
      sessions: 0,
      severity: '',
      high: total_high_vuls_by_service,
      medium: total_medium_vuls_by_service,
      policy_action: v[0].policy_action,
      event_type: '',
      protocols: '',
      applications: Array.from(applicationSet),
      ports: [],
      entries: summarizeEntries(v),
      children: v.map(child => ({
        ...child,
        service: '',
      })) as any,
    };
    if (
      hierarchicalExposure.policy_action !== GlobalConstant.POLICY_ACTION.OPEN
    )
      hierarchicalExposures.push(
        JSON.parse(JSON.stringify(hierarchicalExposure))
      );
  });
  return hierarchicalExposures;
};

const summarizeEntries = exposedPods => {
  let entryMap = {};
  exposedPods.forEach(expsosedPod => {
    expsosedPod.entries.forEach(entry => {
      if (entryMap[`${expsosedPod.display_name}-${entry.ip}`]) {
        if (entry.application) {
          entryMap[`${expsosedPod.display_name}-${entry.ip}`].applications =
            accumulateProtocols(
              entryMap[`${expsosedPod.display_name}-${entry.ip}`].applications,
              entry.application
            );
        }
        if (entry.port) {
          entryMap[`${expsosedPod.display_name}-${entry.ip}`].applications =
            accumulateProtocols(
              entryMap[`${expsosedPod.display_name}-${entry.ip}`].applications,
              entry.port
            );
        }
        entryMap[`${expsosedPod.display_name}-${entry.ip}`].applications =
          entryMap[
            `${expsosedPod.display_name}-${entry.ip}`
          ].applications.filter(app => !!app);
        entryMap[`${expsosedPod.display_name}-${entry.ip}`].sessions +=
          entry.sessions;
        entryMap[`${expsosedPod.display_name}-${entry.ip}`].policy_action =
          accumulateActionLevel(
            entryMap[`${expsosedPod.display_name}-${entry.ip}`].action,
            entry.policy_action
          );
      } else {
        entryMap[`${expsosedPod.display_name}-${entry.ip}`] = {
          pod: expsosedPod.display_name,
          applications: [entry.application],
          sessions: entry.sessions,
          policy_action: entry.policy_action,
          ip: entry.ip,
          fqdn: entry.fqdn || '',
          country_code: entry.country_code,
          country_name: entry.country_name,
          last_seen_at: entry.last_seen_at,
        };
      }
    });
  });
  return Object.values(entryMap) as ConversationReportEntryByService[];
};

export const accumulateActionLevel = (
  accuAction: string = 'allow',
  currAction: string
) => {
  const actionMap = {
    deny: 3,
    alert: 2,
    allow: 1,
  };
  return actionMap[accuAction.toLowerCase()] >
    actionMap[currAction.toLowerCase()]
    ? accuAction
    : currAction;
};

const accumulateProtocols = (accuApps: Array<string> = [], currApp: string) => {
  if (!accuApps.includes(currApp)) accuApps.push(currApp);
  return accuApps;
};

export function workloadToV2(workload: Workload): WorkloadChildV2 {
  return {
    brief: {
      author: workload.author,
      display_name: workload.display_name,
      domain: workload.domain,
      host_id: workload.host_id,
      host_name: workload.host_name,
      id: workload.id,
      image: workload.image,
      image_id: workload.image_id,
      image_created_at: workload.image_created_at,
      image_reg_scanned: workload.image_reg_scanned,
      name: workload.name,
      service: workload.service,
      service_group: workload.service_group,
      state: workload.state,
    },
    created_at: workload.created_at,
    enforcer_id: workload.enforcer_id,
    enforcer_name: workload.enforcer_name,
    exit_code: workload.exit_code,
    finished_at: workload.finished_at,
    platform_role: workload.platform_role,
    rt_attributes: {
      applications: workload.applications,
      cpus: workload.cpus,
      interfaces: workload.interfaces,
      labels: workload.labels,
      memory_limit: workload.memory_limit,
      network_mode: workload.network_mode,
      pod_name: workload.pod_name,
      ports: workload.ports,
      privileged: workload.privileged,
      run_as_root: workload.run_as_root,
    },
    running: workload.running,
    secured_at: workload.secured_at,
    security: {
      cap_change_mode: workload.cap_change_mode,
      cap_quarantine: workload.cap_quarantine,
      cap_sniff: workload.cap_sniff,
      policy_mode: workload.policy_mode,
      scan_summary: workload.scan_summary,
      service_mesh: workload.service_mesh,
      service_mesh_sidecar: workload.service_mesh_sidecar,
    },
    started_at: workload.started_at,
  };
}

export function serviceToGroup(service: Service): Group {
  return {
    ...service,
    kind: 'container',
  } as any;
}

export function getValueType4Text(valueText: string): string {
  const booleanValues = ['true', 'false'];
  if (booleanValues.includes(valueText)) return 'boolean';
  if (!isNaN(valueText as any)) return 'number';
  return 'string';
}

export function isIpV4(str: string): boolean {
  let pattern = new RegExp(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  );
  return pattern.test(str);
}

export function isIpV6(str: string): boolean {
  let pattern = new RegExp(
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/
  );
  return pattern.test(str);
}

export function filterExitWorkloads(workloads: Workload[]) {
  return workloads
    .filter(w => w.state !== 'exit')
    .map(workload => {
      workload.children = workload.children.filter(w => w.state !== 'exit');
      return workload;
    });
}

export function filterExitWorkloadsV2(workloads: WorkloadV2[]) {
  return workloads
    .filter(w => w.brief.state !== 'exit')
    .map(workload => {
      workload.children = workload.children.filter(
        w => w.brief.state !== 'exit'
      );
      return workload;
    });
}

export function updateGridData(
  dataset: Array<any>,
  targetDataArray: Array<any>,
  gridApi: GridApi,
  keyNames: string | string[],
  op: DataOps,
  originalDataArray: Array<any> | null = null,
  canOverrideKey: boolean = false
): void {
  let index = -1;
  const getIndex = function (dataset, queryData, keyNames) {
    return dataset.findIndex(dataElem => {
      if (Array.isArray(keyNames)) {
        return keyNames
          .map(keyName => {
            return dataElem[keyName] === queryData[keyName];
          })
          .reduce((curr, next) => {
            return curr && next;
          });
      } else {
        return dataElem[keyNames] === queryData[keyNames];
      }
    });
  };
  let queryDataArray = canOverrideKey ? originalDataArray : targetDataArray;
  if (op === 'delete') {
    queryDataArray!.forEach(queryData => {
      index = getIndex(dataset, queryData, keyNames);
      if (index > -1) {
        dataset.splice(index, 1);
      }
    });
  } else {
    index = getIndex(dataset, queryDataArray![0], keyNames);
    if (index > -1) {
      if (op === 'edit') {
        dataset.splice(index, 1, targetDataArray[0]);
      }
    } else {
      index = dataset.length;
      dataset.splice(index, 1, targetDataArray[0]);
    }
  }

  gridApi.setGridOption('rowData', dataset);
  setTimeout(() => {
    if (op === 'delete') index = 0;
    let rowNode = gridApi.getDisplayedRowAtIndex(index);
    rowNode?.setSelected(true);
  }, 200);
}

export function isValidBased64(str) {
  if (str) {
    // Remove any whitespace characters from the string
    str = str.replace(/\s/g, '');

    // Check if the string is a valid base64 encoded string
    try {
      return btoa(atob(str)) === str;
    } catch (e) {
      return false;
    }
  } else {
    return false;
  }
}

export function getContrastRatio(background, foreground) {
  const getLuminance = color => {
    const rgb = color.slice(1);
    const r = parseInt(rgb.substr(0, 2), 16) / 255;
    const g = parseInt(rgb.substr(2, 2), 16) / 255;
    const b = parseInt(rgb.substr(4, 2), 16) / 255;

    const sRGB = [r, g, b].map(channel => {
      if (channel <= 0.03928) {
        return channel / 12.92;
      }
      return Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const backgroundLuminance = getLuminance(background);
  const foregroundLuminance = getLuminance(foreground);

  const contrastRatio =
    (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
    (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);

  return contrastRatio;
}

export function isGoodContrastRatio(contrastRatio) {
  return contrastRatio >= 4.5;
}

export function getNamespaceRoleGridData(
  domainRoleOptions: string[],
  globalRole?: string,
  domainRoles?: Object
): {
  namespaceRole: string;
  namespaces: any[];
}[] {
  if (domainRoles) {
    let roleMap = Object.entries(domainRoles).map(([key, value]) => {
      return {
        namespaceRole: key,
        namespaces: value,
      };
    });
    return domainRoleOptions
      .map(domainRoleOption => {
        let roleIndex = roleMap.findIndex(
          role => role.namespaceRole === domainRoleOption
        );
        if (roleIndex > -1) {
          return roleMap[roleIndex];
        } else {
          return {
            namespaceRole: domainRoleOption,
            namespaces: [],
          };
        }
      })
      .filter(role => role.namespaceRole !== globalRole);
  } else {
    return domainRoleOptions
      .map(domainRoleOption => ({
        namespaceRole: domainRoleOption,
        namespaces: [],
      }))
      .filter(role => role.namespaceRole !== globalRole);
  }
}

export function sortByOrder<T extends Record<string, any>>(array: T[], order: string[]): T[] {
  return array.map(item => {
    const sortedKeys = Object.keys(item).sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      if (indexA !== -1) {
        return -1;
      }

      if (indexB !== -1) {
        return 1;
      }

      return 0;
    });

    const sortedItem: any = {};
    sortedKeys.forEach(key => {
      sortedItem[key] = item[key];
    });

    return sortedItem;
  });
}
