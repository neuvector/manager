import { Injectable } from '@angular/core';
import { RisksHttpService } from '@common/api/risks-http.service';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { AssetsHttpService } from '@common/api/assets-http.service';
import {
  ComplianceAvailableFilters,
  ComplianceProfileData,
  complianceProfileEntries,
  ComplianceProfileTemplateData,
  DomainGetResponse,
} from '@common/types';
import { MapConstant } from '@common/constants/map.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';

export interface DomainResponse extends DomainGetResponse {
  imageTags: string[];
  containerTags: string[];
  nodeTags: string[];
}

@Injectable()
export class ComplianceProfileService {
  private resizeSubject$ = new BehaviorSubject<boolean>(true);
  resize$ = this.resizeSubject$.asObservable();
  private refreshSubject$ = new Subject<void>();
  lastEntries!: complianceProfileEntries[];

  constructor(
    private risksHttpService: RisksHttpService,
    private assetsHttpService: AssetsHttpService,
    private authUtils: AuthUtilsService
  ) {}

  refresh() {
    setTimeout(() => {
      this.refreshSubject$.next();
    }, 500);
  }

  initComplianceProfile() {
    return this.refreshSubject$.pipe(
      startWith(null),
      switchMap(() =>
        combineLatest([
          this.getTemplate(),
          this.getProfile(),
          this.getDomain(),
          this.getAvailableFilters(),
        ]).pipe(
          map(([template, profile, domains, filters]) => ({
            template,
            profile,
            domains,
            filters,
          })),

          tap(({ profile }) => {
            this.lastEntries = profile.profiles[0]?.entries || [];
          }),

          map(res => {
            res.profile.profiles[0]?.entries.forEach(p => {
              res.template.list.compliance.forEach(e => {
                if (e.test_number === p.test_number) {
                  e.tags = p.tags;
                }
              });
            });
            return res;
          })
        )
      )
    );
  }

  resize() {
    this.resizeSubject$.next(true);
  }

  saveRegulations(payload) {
    return this.risksHttpService.patchComplianceProfile(payload);
  }

  saveTemplates(payload) {
    return this.assetsHttpService.patchDomain(payload);
  }

  toggleDomainTagging(payload) {
    return this.assetsHttpService.postDomain(payload);
  }

  exportProfile(payload) {
    return this.risksHttpService.exportComplianceProfile(payload);
  }

  private getAvailableFilters(): Observable<ComplianceAvailableFilters> {
    return this.risksHttpService.getAvailableComplianceFilter();
  }

  private getTemplate(): Observable<ComplianceProfileTemplateData> {
    if (!this.authUtils.getDisplayFlag('read_compliance_profile')) {
      return of({ list: { compliance: [] } });
    } else {
      return this.risksHttpService.getComplianceProfileTemplate().pipe(
        catchError(err => {
          if (
            [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
              err.status
            )
          ) {
            return of({ list: { compliance: [] } });
          } else {
            throw err;
          }
        })
      );
    }
  }

  private getProfile(): Observable<ComplianceProfileData> {
    return this.risksHttpService.getComplianceProfile().pipe(
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({ profiles: [] });
        } else {
          throw err;
        }
      })
    );
  }

  private getDomain(): Observable<DomainResponse> {
    return this.assetsHttpService.getDomain().pipe(
      map(domainRes => {
        let res: DomainResponse = domainRes as any;
        res['imageTags'] =
          res.domains.find(item => item.name === '_images')?.tags || [];
        res['containerTags'] =
          res.domains.find(item => item.name === '_containers')?.tags || [];
        res['nodeTags'] =
          res.domains.find(item => item.name === '_nodes')?.tags || [];
        res.domains = res.domains.filter(d => d.name.charAt(0) !== '_');
        return res;
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of({
            domains: [],
            imageTags: [],
            containerTags: [],
            nodeTags: [],
            tag_per_domain: false,
          } as any);
        } else {
          throw err;
        }
      })
    );
  }
}
