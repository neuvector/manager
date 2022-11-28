import { Injectable } from '@angular/core';
import { RisksHttpService } from '@common/api/risks-http.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, repeatWhen, tap } from 'rxjs/operators';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { complianceProfileEntries } from '@common/types';

@Injectable()
export class ComplianceProfileService {
  private resizeSubject$ = new BehaviorSubject<boolean>(true);
  resize$ = this.resizeSubject$.asObservable();
  private refreshSubject$ = new BehaviorSubject<boolean>(false);
  lastEntries!: complianceProfileEntries[];

  constructor(
    private risksHttpService: RisksHttpService,
    private assetsHttpService: AssetsHttpService
  ) {}

  refresh() {
    setTimeout(() => {
      this.refreshSubject$.next(false);
    }, 500);
  }

  initComplianceProfile() {
    return combineLatest([
      this.getTemplate(),
      this.getProfile(),
      this.getDomain(),
    ]).pipe(
      map(([template, profile, domains]) => {
        return {
          template,
          profile,
          domains,
        };
      }),
      tap(({ profile }) => {
        this.lastEntries = profile.profiles[0].entries;
      }),
      map(res => {
        res.profile.profiles[0].entries.forEach(p => {
          res.template.list.compliance.forEach(e => {
            if (e.test_number === p.test_number) {
              e.tags = p.tags;
            }
          });
        });
        return res;
      }),
      repeatWhen(() => this.refreshSubject$)
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

  private getTemplate() {
    return this.risksHttpService.getComplianceProfileTemplate();
  }

  private getProfile() {
    return this.risksHttpService.getComplianceProfile();
  }

  private getDomain() {
    return this.assetsHttpService.getDomain().pipe(
      map(res => {
        res['imageTags'] = res.domains.find(
          item => item.name === '_images'
        )!.tags;
        res['containerTags'] = res.domains.find(
          item => item.name === '_containers'
        )!.tags;
        res['nodeTags'] = res.domains.find(
          item => item.name === '_nodes'
        )!.tags;
        res.domains = res.domains.filter(d => d.name.charAt(0) !== '_');
        return res;
      })
    );
  }
}
