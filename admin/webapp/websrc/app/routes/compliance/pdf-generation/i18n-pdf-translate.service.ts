import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';

@Injectable()
export class i18nPdfTranslateService {
  constructor(private translateService: TranslateService) {
    this.translateService.use('en');
  }

  getI18NMessages(options) {
    return {
      title: this.translateService.instant('cis.report.TITLE'),
      title2: this.translateService.instant('cis.report.TITLE2'),
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
        complianceCnt: this.translateService.instant(
          'cis.report.gridHeader.COMPLIANCE_CNT'
        ),
        complianceList: this.translateService.instant(
          'cis.report.gridHeader.COMPLIANCE_LIST'
        ),
        category: this.translateService.instant(
          'cis.report.gridHeader.CATEGORY'
        ),
        name: this.translateService.instant('cis.report.gridHeader.NAME'),
        desc: this.translateService.instant('cis.report.gridHeader.DESC'),
        level: this.translateService.instant('cis.report.gridHeader.LEVEL'),
        scored: this.translateService.instant('cis.report.gridHeader.SCORED'),
        profile: this.translateService.instant('cis.report.gridHeader.PROFILE'),
        impact: this.translateService.instant('cis.report.gridHeader.IMPACT'),
        remediation: this.translateService.instant(
          'cis.report.gridHeader.REMEDIATION'
        ),
      },
      data: {
        platforms: this.translateService.instant('cis.report.data.PLATFORMS'),
        images: this.translateService.instant('cis.report.data.IMAGES'),
        nodes: this.translateService.instant('cis.report.data.NODES'),
        containers: this.translateService.instant('cis.report.data.CONTAINERS'),
      },
      others: {
        topImpactfulcomplianceList: this.translateService.instant(
          'cis.report.others.TOP_IMPACTFUL_COMP'
        ),
        reportSummary: this.translateService.instant(
          'audit.report.summaryHeader'
        ),
        logoName: this.translateService.instant('partner.general.LOGO_NAME'),
        topImpactfulComplianceOnContainers: this.translateService.instant(
          'cis.report.others.TOP_COMP_CONTAINER'
        ),
        footerText: this.translateService.instant('containers.report.footer'),
        headerText: this.translateService.instant(
          'partner.containers.report.header'
        ),
        appendixText: this.translateService.instant(
          'cis.report.others.APPENDIX'
        ),
        appendixDesc: this.translateService.instant(
          'cis.report.others.APPENDIX_DESC'
        ),
        subTitleDetails: this.translateService.instant(
          'cis.report.others.DETAILS'
        ),

        appendixText2: this.translateService.instant(
          'cis.report.others.APPENDIX2'
        ),
        appendixDesc2: this.translateService.instant(
          'cis.report.others.APPENDIX_DESC2'
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
