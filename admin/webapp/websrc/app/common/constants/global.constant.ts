export class GlobalConstant {
  public static SAML = 'saml';
  public static SESSION_STORAGE_CLUSTER = 'cluster';
  public static SESSION_STORAGE_TOKEN = 'token';
  public static SESSION_STORAGE_ORIGINAL_URL = 'original_url';
  public static SESSION_STORAGE_TIMEOUT = 'session_timeout';
  public static SESSION_STORAGE_THEME = 'theme';
  public static SESSION_STORAGE_NOTIFICATIONS = 'notifications';
  public static REQ_TOKEN = 'X-Auth-Token';
  // public static REQ_CONTENT_TYPE = "Content-Type";
  // public static REQ_CONTENT_TYPE_VAL = "application/json";
  public static LOGIN_URL = 'auth';
  public static STATUS_AUTH_TIMEOUT = 408;
  public static STATUS_UNAUTH = 401;
  public static STATUS_SERVER_UNAVAILABLE = 503;
  public static STATUS_INTERNAL_SERVER_ERR = 500;
  public static STATUS_NOT_FOUND = 404;
  public static PATH_LOGIN = 'login';
  public static PATH_DEFAULT = 'dashboard';
  public static AG_GRID_RESIZE = 'resize.#agGrid';
  public static NETWORK_RULES_NEW_ID_SEED = 1000000;
  public static NETWORK_RULES_PORTS_DISPLAY_LEN = 40;
  public static EXTERNAL = 'external';
  public static PROXY_VALUE = 'neuvector-service-webui:8443/proxy';
  public static NO_CAHCE = 'no-cache';
  public static KUBE = 'kubernetes';
  public static OPENSHIFT = 'Kubernetes-OpenShift';
  public static RANCHER = 'Kubernetes-Rancher';
  public static OC = 'openshift';
  public static MAX_ENFORCER_LOG = 10;
  public static MAX_INTERFACE_IP = 3;
  public static MAX_UNUPDATED_DAYS = 7;
  public static NEW_ID_SEED = {
    NETWORK_RULE: 1000000,
  };
  public static CRUD = {
    C: 'post',
    R: 'get',
    U: 'patch',
    D: 'delete',
  };
  public static MODAL_OP = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
  };
  public static SCOPE = {
    FED: 'fed',
    LOCAL: 'local',
  };
  public static MODE = {
    PROTECT: 'protect',
    MONITOR: 'monitor',
  };
  public static MODES = ['discover', 'monitor', 'protect'];
  public static CFG_TYPE = {
    LEARNED: 'learned',
    CUSTOMER: 'user_created',
    GROUND: 'ground',
    FED: 'federal',
  };
  public static NETWORK_RULES_STATE = {
    NEW: 'new-rule',
    MODIFIED: 'modified-rule',
    LEARNED: 'learn-rule',
    DISABLED: 'disabled-rule',
    GROUND: 'ground-rule',
    CUSTOMER: 'customer-rule',
    FED: 'federate-rule',
    READONLY: 'readonly-rule',
    MOVED: 'moved-rule',
  };

  public static SINGLE_VALUE_CRITERIA = [
    'user',
    'image',
    'imageregistry',
    'namespace',
  ];

  public static ADMISSION = {
    INTERNAL_ERR_CODE: {
      UNSUPPORTED: 30,
      CLUSTER_ROLE_NOT_CONFIG: 31,
      WEBHOOK_NOT_CONFIG: 32,
      NO_UPD_PROMISSION: 33,
      ERR_SRV2WEBHOOK: 34,
      CONFIG_K8S_FAIL: 28,
    },
    RULE_TYPE: {
      ALLOW: 'exception',
      EXCEPTION: 'allow',
      DENY: 'deny',
      FED_DENY: 'federal-policy',
    },
    SINGLE_VALUE_CRITERIA: ['user', 'image', 'imageregistry', 'namespace'],
    CATEGORY: {
      KUBE: 'Kubernetes',
    },
    BOOLEAN_CRITERIA: {
      TRUE: ['runAsRoot', 'runAsPrivileged'],
      FALSE: ['imageScanned', 'imageSigned'],
    },
    CRITERION_TYPE: {
      BIND_RISKY_ROLE: 'saBindRiskyRole',
      CUSTOM_PATH: 'customPath',
    },
  };

  public static NAV_SOURCE = {
    FED_POLICY: 'federal-policy',
    GROUP: 'group',
    SELF: 'self',
  };

  public static RESPONSE_RULE = {
    EVENTS_K8S: [
      'security-event',
      'event',
      'cve-report',
      'compliance',
      'admission-control',
    ],
    EVENTS: ['security-event', 'event', 'cve-report', 'benchmark'],
    ACTIONS_3: ['webhook', 'suppress-log', 'quarantine'],
    ACTIONS_2: ['webhook', 'suppress-log'],
  };

  public static CLUSTER_TYPES = {
    ORDINARY: '',
    MASTER: 'master',
    MEMBER: 'joint',
  };

  public static CLUSTER_ACTION_TYPES = {
    PROMOTION: 'promotion',
    JOINING: 'joining',
  };

  public static ValidPatterns = {
    IP: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    PORT: '^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$',
  };

  public static PROCESS_PROFILE_RULE = {
    ACTION: {
      DENY: 'deny',
      ALLOW: 'allow',
    },
  };

  public static FILE_ACCESS_RULE = {
    BEHAVIOR: {
      MONITOR: 'monitor_change',
      BLOCK: 'block_access',
    },
  };

  public static SEC_EVENT = {
    TYPE: {
      THREAT: 'threat',
      VIOLATION: 'violation',
      INCIDENT: 'incident',
    },
    ENDPOINT: {
      SOURCE: 'source',
      DESTINATION: 'destination',
    },
    PROTOCOL: 'protocal',
  };

  public static TAB_NAME = {
    MEMBER: 0,
    SCRIPT: 1,
    PROFILE: 2,
    FILE: 3,
    NETWORK: 4,
    DLP: 5,
  };
  public static GLOBAL = 'Global action';

  public static topBar = 65;
  public static sectionPadding = 20 * 2;
  public static verticalPadding = 15 * 2;
  public static header = 0;
  public static title = 40;
  public static marginInBoxes = 18;

  public static CRITERIA_PATTERN = {
    NAME_ONLY: [
      'imageSigned',
      'runAsRoot',
      'runAsPrivileged',
      'allowPrivEscalation',
      'pspCompliance',
    ],
    CVE_COUNT: ['cveHighCount', 'cveHighWithFixCount', 'cveMediumCount'],
    CVE_SCORE: ['cveScoreCount'],
    RESOURCE: ['resourceLimit'],
    SINGLE_VALUE_CRITERIA: ['user', 'image', 'imageRegistry', 'namespace'],
  };
  public static PSP = 'pspcompliance';
  public static RESIZE_EVENT = 'resize.ag-grid';

  public static SCORE_LEVEL = {
    GOOD: 20,
    FAIR: 50,
    POOR: 100,
  };
  public static SCORE_COLOR = {
    GOOD: '#00CC00',
    FAIR: '#FF8000',
    POOR: '#FF0000',
  };

  public static REPORT_SIZE = {
    RISK_REPORT: 1000,
  };
}
