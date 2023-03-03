const DASHBOARD = {
  text: 'Dashboard',
  translate: 'sidebar.nav.DASHBOARD',
  link: '/dashboard',
  icon: 'performance',
};
const NETWORK_ACTIVITY = {
  text: 'Network Activity',
  translate: 'sidebar.nav.NETWORK_ACTIVITY',
  link: '/graph',
  icon: 'neural_network',
};
const ASSETS = {
  text: 'Assets',
  translate: 'sidebar.nav.RESOURCE',
  icon: 'products',
  submenu: [
    {
      text: 'Platform',
      translate: 'scan.PLATFORM',
      link: '/platforms',
    },
    {
      text: 'Namespaces',
      translate: 'sidebar.nav.NAMESPACES',
      link: '/domains',
    },
    {
      text: 'Nodes',
      translate: 'sidebar.nav.NODES',
      link: '/hosts',
    },
    {
      text: 'Containers',
      translate: 'sidebar.nav.CONTAINERS',
      link: '/workloads',
    },
    {
      text: 'Registries',
      translate: 'sidebar.nav.REG_SCAN',
      link: '/regScan',
    },
    {
      text: 'System Components',
      translate: 'sidebar.nav.SYSTEM_COMPONENTS',
      link: '/controllers',
    },
  ],
};
const POLICY = {
  text: 'Policy',
  translate: 'sidebar.nav.SECURITY',
  icon: 'policy',
  submenu: [
    {
      text: 'Admission Control',
      translate: 'sidebar.nav.ADMISSION_CONTROL',
      link: '/admission-control',
    },
    {
      text: 'Groups',
      translate: 'sidebar.nav.GROUP',
      link: '/group',
    },
    {
      text: 'Network Rules',
      translate: 'sidebar.nav.POLICY',
      link: '/policy',
    },
    {
      text: 'Response Rules',
      translate: 'sidebar.nav.RESPONSE_POLICY',
      link: '/response-policy',
    },
    {
      text: 'DLP Sensors',
      translate: 'sidebar.nav.DLP_SENSORS',
      link: '/dlp-sensors',
    },
    {
      text: 'WAF Sensors',
      translate: 'sidebar.nav.WAF_SENSORS',
      link: '/waf-sensors',
    },
  ],
};
const SECURITY_RISKS = {
  text: 'Security Risks',
  translate: 'sidebar.nav.RISK',
  icon: 'critical_bug',
  submenu: [
    {
      text: 'Vulnerabilities',
      translate: 'sidebar.nav.SCAN',
      link: '/scan',
    },
    {
      text: 'Vulnerability Profile',
      translate: 'cveProfile.TITLE',
      link: '/cveProfile',
    },
    {
      text: 'Compliance',
      translate: 'sidebar.nav.BENCH',
      link: '/bench',
    },
    {
      text: 'Compliance Profile',
      translate: 'cis.COMPLIANCE_PROFILE',
      link: '/cisProfile',
    },
  ],
};
const NOTIFICATIONS = {
  text: 'Notifications',
  translate: 'sidebar.nav.NOTIFICATIONS',
  icon: 'notifications_none',
  submenu: [
    {
      text: 'Security Events',
      translate: 'sidebar.nav.SECURITY_EVENT',
      link: '/security-event',
    },
    {
      text: 'Risk Reports',
      translate: 'sidebar.nav.AUDIT',
      link: '/audit',
    },
    {
      text: 'Events',
      translate: 'sidebar.nav.EVENT',
      link: '/event',
    },
  ],
};
const SETTINGS = {
  text: 'Settings',
  translate: 'sidebar.nav.SETTING',
  link: '/settings',
  icon: 'settings_suggest',
};

export const menu = [
  DASHBOARD,
  NETWORK_ACTIVITY,
  ASSETS,
  POLICY,
  SECURITY_RISKS,
  NOTIFICATIONS,
  SETTINGS,
];
