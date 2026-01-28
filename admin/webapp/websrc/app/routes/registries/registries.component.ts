import { Component, OnInit, OnDestroy } from '@angular/core';
import { RegistriesCommunicationService } from './regestries-communication.service';
import { catchError, map } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  standalone: false,
  selector: 'app-registries',
  templateUrl: './registries.component.html',
  styleUrls: ['./registries.component.scss'],
})
export class RegistriesComponent implements OnInit, OnDestroy {
  error: unknown;
  isVulAuthorized: Boolean;
  isMultiClusterAuthorized: boolean =
    this.authUtilsService.getDisplayFlag('multi_cluster');
  registries$ = this.registriesCommunicationService.registries$.pipe(
    map(res => {
      const updatedSummaries = res.summarys.map(summary => ({
        ...summary,
        use_proxy: !summary.ignore_proxy,
      }));
      this.isVulAuthorized =
        this.authUtilsService.getDisplayFlag('vuls_profile');
      let scannedCnt = res.summarys.reduce(
        (sum, curr) => sum + curr.scanned,
        0
      );
      const baseSummary = {
        auth_token: '',
        auth_with_token: false,
        cvedb_create_time: '',
        cvedb_version: '',
        domains: '',
        error_detail: '',
        error_message: '',
        failed: 0,
        filters: [],
        gitlab_external_url: '',
        gitlab_private_token: '',
        ibm_cloud_account: '',
        ibm_cloud_token_url: '',
        ignore_proxy: false,
        jfrog_aql: false,
        jfrog_mode: '',
        password: '',
        registry: '',
        registry_type: '',
        repo_limit: 0,
        rescan_after_db_update: true,
        scan_layers: true,
        scanned: 0,
        scanning: 0,
        schedule: {
          interval: 0,
          schedule: '',
        },
        scheduled: 0,
        started_at: '',
        status: '',
        tag_limit: 0,
        username: '',
        use_proxy: false,
        isAllView: true,
        isFedRepo: true,
      };
      if (
        res.summarys &&
        res.summarys.length > 0 &&
        scannedCnt > 0 &&
        this.isVulAuthorized
      ) {
        updatedSummaries.push({
          ...baseSummary,
          name: this.tr.instant('registry.VIEW_ALL_IMAGES'),
          isFedRepo: false,
        });
      }

      if (this.isMultiClusterAuthorized || GlobalVariable.isMember) {
        updatedSummaries.push({
          ...baseSummary,
          name:
            GlobalVariable.isMaster && !GlobalVariable.isRemote
              ? '_repo_scan'
              : (GlobalVariable.isMaster && GlobalVariable.isRemote) ||
                  GlobalVariable.isMember
                ? 'fed._repo_scan'
                : '',
          isAllView: false,
        });
      }
      return { summarys: updatedSummaries };
    }),
    catchError(err => {
      this.error = err;
      throw err;
    })
  );
  refreshingDetails$ = this.registriesCommunicationService.refreshingDetails$;
  linkedRegistry: string = '';
  linkedImage: string = '';
  linkedTag: string = '';
  private switchClusterSubscription;

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService,
    private multiClusterService: MultiClusterService,
    private authUtilsService: AuthUtilsService,
    private route: ActivatedRoute,
    private tr: TranslateService
  ) {
    this.route.queryParams.subscribe(params => {
      this.linkedRegistry = decodeURIComponent(params['registry'] || '');
      this.linkedImage = decodeURIComponent(params['image'] || '');
      this.linkedTag = decodeURIComponent(params['tag'] || '');
    });
  }

  ngOnInit(): void {
    //refresh the page when it switched to a remote cluster
    this.switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
  }

  refresh(): void {
    this.registriesCommunicationService.initRefreshingRegistries();
    this.registriesCommunicationService.refreshRegistries();
  }
}
