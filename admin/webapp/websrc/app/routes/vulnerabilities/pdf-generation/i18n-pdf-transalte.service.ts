import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';

@Injectable()
export class i18nPdfTranslateService {
  constructor(private translateService: TranslateService) {

  }

  getI18NMessages(options) {
    return {
      title: this.translateService.instant('scan.report.TITLE'),
      title2: this.translateService.instant('scan.report.TITLE2'),
      wlHeader: {
        name: this.translateService.instant('containers.detail.NAME'),
        domain: this.translateService.instant('audit.gridHeader.DOMAIN'),
        apps: this.translateService.instant('containers.detail.APPLICATIONS'),
        policyMode: this.translateService.instant(
          'containers.detail.POLICY_MODE'
        ),
        group: this.translateService.instant('group.GROUP'),
        scanned_at: this.translateService.instant('scan.gridHeader.TIME'),
      },
      htHeader: {
        name: this.translateService.instant('nodes.detail.NAME'),
        os: this.translateService.instant('nodes.detail.OS'),
        kernel: this.translateService.instant('nodes.detail.KERNEL_VERSION'),
        cpus: this.translateService.instant('nodes.detail.NUM_OF_CPUS'),
        memory: this.translateService.instant('nodes.detail.MEMORY'),
        containers: this.translateService.instant(
          'nodes.detail.NUM_OF_CONTAINERS'
        ),
        policyMode: this.translateService.instant(
          'containers.detail.POLICY_MODE'
        ),
        scanned_at: this.translateService.instant('scan.gridHeader.TIME'),
      },
      pfHeader: {
        name: this.translateService.instant('nodes.detail.NAME'),
        version: this.translateService.instant('scan.gridHeader.VERSION'),
        baseOs: this.translateService.instant('audit.gridHeader.BASE_OS'),
      },
      mgHeader: {
        name: this.translateService.instant('nodes.detail.NAME'),
      },
      header: {
        vulsCnt: this.translateService.instant('scan.report.gridHeader.HI_MED'),
        vuls: this.translateService.instant('group.gridHeader.VULNERABILITIES'),
        name: this.translateService.instant('scan.report.gridHeader.NAME'),
        score: this.translateService.instant('scan.report.gridHeader.SCORE'),
        package: this.translateService.instant(
          'scan.report.gridHeader.PACKAGES'
        ),
        publishedTime: this.translateService.instant(
          'scan.gridHeader.PUBLISHED_TIME'
        ),
        desc: this.translateService.instant('scan.report.gridHeader.DESC'),
        impact: this.translateService.instant('scan.report.gridHeader.IMPACT'),
      },
      data: {
        v2: this.translateService.instant('scan.report.data.V2'),
        v3: this.translateService.instant('scan.report.data.V3'),
        impactedVersion: this.translateService.instant(
          'scan.report.data.IMPACTED'
        ),
        fixedVersion: this.translateService.instant('scan.report.data.FIXED'),
        platforms: this.translateService.instant('scan.report.data.PLATFORMS'),
        images: this.translateService.instant('scan.report.data.IMAGES'),
        nodes: this.translateService.instant('scan.report.data.NODES'),
        containers: this.translateService.instant(
          'scan.report.data.CONTAINERS'
        ),
      },
      others: {
        topImpactfulVulnerabilities: this.translateService.instant(
          'scan.report.others.TOP_IMPACTFUL_VUL'
        ),
        reportSummary: this.translateService.instant(
          'audit.report.summaryHeader'
        ),
        logoName: this.translateService.instant('partner.general.LOGO_NAME'),
        topVulnerableImages: this.translateService.instant(
          'scan.report.others.TOP_VULNERABLE_IMAGES'
        ),
        footerText: this.translateService.instant('containers.report.footer'),
        headerText: this.translateService.instant(
          'partner.containers.report.header'
        ),
        appendixText: this.translateService.instant(
          'scan.report.others.APPENDIX'
        ),
        appendixDesc: this.translateService.instant(
          'scan.report.others.APPENDIX_DESC'
        ),
        appendixPackagesText: this.translateService.instant(
          'scan.report.others.APPENDIX_PACKAGES'
        ),
        appendixPackagesDesc: this.translateService.instant(
          'scan.report.others.APPENDIX_PACKAGES_DESC'
        ),
        appendixText2: this.translateService.instant(
          'scan.report.others.APPENDIX2'
        ),
        appendixDesc2: this.translateService.instant(
          'scan.report.others.APPENDIX_DESC2'
        ),
        subTitleDetails: this.translateService.instant(
          'scan.report.others.DETAILS'
        ),
        summaryRange: this.translateService.instant(
          'general.PDF_SUMMARY_RANGE_2',
          {
            rangedCount: options.filteredCount,
          }
        ),
        detailsLimit:
          options.filteredCount > MapConstant.REPORT_TABLE_ROW_LIMIT
            ? this.translateService.instant('general.PDF_TBL_ROW_LIMIT', {
                max: MapConstant.REPORT_TABLE_ROW_LIMIT,
              })
            : '',
        KUBE: GlobalConstant.KUBE,
        OC: GlobalConstant.OC,
      },
    };
  }
}
