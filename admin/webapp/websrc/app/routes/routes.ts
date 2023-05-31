import { Routes } from '@angular/router';
import { FrameComponent } from '../frame/frame.component';
import { LoginComponent } from './pages/login/login.component';
import { LogoutComponent } from './pages/logout/logout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: FrameComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'logout', redirectTo: 'logout', pathMatch: 'full' },
      {
        path: 'profile',
        loadChildren: () =>
          import('./settings/profile/profile.module').then(
            m => m.ProfileModule
          ),
      },
      {
        path: 'federated-policy',
        loadChildren: () =>
          import('./federated-policy/federated-policy.module').then(
            m => m.FederatedPolicyModule
          ),
      },
      {
        path: 'multi-cluster',
        loadChildren: () =>
          import('./multi-cluster/multi-cluster.module').then(
            m => m.MultiClusterModule
          ),
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: 'graph',
        loadChildren: () =>
          import('./network-activities/network-activities.module').then(
            m => m.NetworkActivitiesModule
          ),
      },
      {
        path: 'platforms',
        loadChildren: () =>
          import('./platforms/platforms.module').then(m => m.PlatformsModule),
      },
      {
        path: 'domains',
        loadChildren: () =>
          import('./namespaces/namespaces.module').then(
            m => m.NamespacesModule
          ),
      },
      {
        path: 'hosts',
        loadChildren: () =>
          import('./nodes/nodes.module').then(m => m.NodesModule),
      },
      {
        path: 'workloads',
        loadChildren: () =>
          import('./containers/containers.module').then(
            m => m.ContainersModule
          ),
      },
      {
        path: 'regScan',
        loadChildren: () =>
          import('./registries/registries.module').then(
            m => m.RegistriesModule
          ),
      },
      {
        path: 'controllers',
        loadChildren: () =>
          import('./system-components/system-components.module').then(
            m => m.SystemComponentsModule
          ),
      },
      {
        path: 'admission-control',
        loadChildren: () =>
          import('./admission-rules-page/admission-rules-page.module').then(
            m => m.AdmissionRulesPageModule
          ),
      },
      {
        path: 'group',
        loadChildren: () =>
          import('./groups-page/groups-page.module').then(
            m => m.GroupsPageModule
          ),
      },
      {
        path: 'policy',
        loadChildren: () =>
          import('./network-rules-page/network-rules-page.module').then(
            m => m.NetworkRulesPageModule
          ),
      },
      {
        path: 'response-policy',
        loadChildren: () =>
          import('./response-rules-page/response-rules-page.module').then(
            m => m.ResponseRulesPageModule
          ),
      },
      {
        path: 'dlp-sensors',
        loadChildren: () =>
          import('./dlp-sensors/dlp-sensors.module').then(
            m => m.DlpSensorsModule
          ),
      },
      {
        path: 'waf-sensors',
        loadChildren: () =>
          import('./waf-sensors/waf-sensors.module').then(
            m => m.WafSensorsModule
          ),
      },
      {
        path: 'scan',
        loadChildren: () =>
          import('./vulnerabilities/vulnerabilities.module').then(
            m => m.VulnerabilitiesModule
          ),
      },
      {
        path: 'cveProfile',
        loadChildren: () =>
          import('./vulnerability-profile/vulnerability-profile.module').then(
            m => m.VulnerabilityProfileModule
          ),
      },
      {
        path: 'bench',
        loadChildren: () =>
          import('./compliance/compliance.module').then(
            m => m.ComplianceModule
          ),
      },
      {
        path: 'cisProfile',
        loadChildren: () =>
          import('./compliance-profile/compliance-profile.module').then(
            m => m.ComplianceProfileModule
          ),
      },
      {
        path: 'event',
        loadChildren: () =>
          import('./events/events.module').then(m => m.EventsModule),
      },
      {
        path: 'security-event',
        loadChildren: () =>
          import('./security-events/security-events.module').then(
            m => m.SecurityEventsModule
          ),
      },
      {
        path: 'audit',
        loadChildren: () =>
          import('./risk-reports/risk-reports.module').then(
            m => m.RiskReportsModule
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.module').then(m => m.SettingsModule),
      },
      {
        path: 'signature-verifiers',
        loadChildren: () =>
          import('./signature-verifiers/signature-verifiers.module').then(m => m.SignatureVerifiersModule),
      },
    ],
  },

  // Not found
  { path: 'logout', component: LogoutComponent },
  { path: 'eula', component: LoginComponent },
  { path: '**', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
];
