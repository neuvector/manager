import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Layer, Vulnerability } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { cloneDeep } from 'lodash';
import { saveAs } from 'file-saver';
import { arrayToCsv, isVulAccepted } from '@common/utils/common.utils';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { VulnerabilitiesGridComponent } from '@components/vulnerabilities-grid/vulnerabilities-grid.component';

@Component({
  standalone: false,
  selector: 'app-registry-vulnerabilities',
  templateUrl: './registry-vulnerabilities.component.html',
  styleUrls: ['./registry-vulnerabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryVulnerabilitiesComponent {
  @Input() path!: string;
  @Input() repository!: string;
  @Input() imageId!: string;
  @Input() baseOS!: string;
  @Input() cveDBVersion!: string;
  @Input() scannerVersion!: string;
  @Input() scannerDate!: string;
  private _layers!: Layer[];
  @Input() set layers(layers: Layer[]) {
    this._layers = layers;
    this.hasLayers =
      this._layers.length > 1 &&
      this._layers.some(
        (l, index) => index > 0 && l.vulnerabilities.length > 0
      );
  }
  @ViewChild(VulnerabilitiesGridComponent)
  vulGrid!: VulnerabilitiesGridComponent;
  get layers() {
    return this._layers;
  }
  hasLayers!: boolean;
  @Input() refreshing!: boolean;
  @Input() resize!: boolean;
  @Output() showAcceptedVulnerability = new EventEmitter<boolean>();
  @Output() acceptVulnerability = new EventEmitter<Vulnerability>();
  @Input() acceptedVulnerabilityStatus!: boolean;
  selectedLayer!: Layer | null;
  selectedVulnerability!: Vulnerability | null;
  selectedVulScore: String = 'V3';
  get activeScore() {
    return this.selectedVulScore === 'V2'
      ? this.tr.instant('scan.gridHeader.SCORE_V2')
      : this.tr.instant('scan.gridHeader.SCORE_V3');
  }

  constructor(
    private utilsService: UtilsService,
    private tr: TranslateService,
    private cd: ChangeDetectorRef
  ) {}

  toggleAcceptedVulnerability(): void {
    this.showAcceptedVulnerability.emit();
  }

  layerSelected(layer: Layer): void {
    this.selectedLayer = layer;
  }

  vulnerabilitySelected(vulnerability: Vulnerability): void {
    this.selectedVulnerability = vulnerability;
  }

  onAcceptVulnerability(): void {
    if (this.selectedVulnerability)
      this.acceptVulnerability.emit(this.selectedVulnerability);
  }

  isAccepted(vulnerability: Vulnerability): boolean {
    return isVulAccepted(vulnerability);
  }

  exportCVELayers(): void {
    const cveByLayer: any = this.prepareLayerCsvData(this.layers.slice(1));
    if (cveByLayer.length > 0) {
      const title = `${this.path + this.repository} | Image Id: ${
        this.imageId
      } |  CVE DB Version: ${this.cveDBVersion}(${moment(
        this.scannerDate.replace(/\,/g, ' ')
      ).format('MM/DD/YYYY hh:mm:ss')}) | OS: ${this.baseOS}`;
      let cveByLayer4Csv = cloneDeep(cveByLayer);
      cveByLayer4Csv = cveByLayer4Csv.map(cve => {
        cve.description = `${cve.description.replace(/\"/g, "'")}`;
        cve.tags = cve.tags || '';
        cve.last_modified_timestamp = new Date(
          cve.last_modified_timestamp * 1000
        );
        cve.published_timestamp = new Date(cve.published_timestamp * 1000);
        return cve;
      });
      const csv = arrayToCsv(cveByLayer4Csv, title);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const filename = `vulnerabilities-${
        this.path + this.repository
      }_${this.utilsService.parseDatetimeStr(new Date())}.csv`;
      saveAs(blob, filename);
    }
  }

  exportCVE(): void {
    if (
      this.selectedLayer?.vulnerabilities &&
      this.selectedLayer.vulnerabilities.length > 0
    ) {
      const title = `${this.path + this.repository} | Image ID: ${
        this.imageId
      } |  CVE DB Version: ${this.cveDBVersion}(${moment(
        this.scannerDate.replace(/\,/g, ' ')
      ).format('MM/DD/YYYY hh:mm:ss')}) | OS: ${this.baseOS}${
        this.selectedLayer?.verifiers &&
        this.selectedLayer?.verifiers.length > 0
          ? `\nSigstore Verifiers: ${this.selectedLayer?.verifiers.join(
              ' | '
            )} (Verified at: ${this.selectedLayer?.verificationTimestamp})`
          : ''
      }`;
      let cves4Csv: any = cloneDeep(this.selectedLayer.vulnerabilities);
      cves4Csv = cves4Csv.map(cve => {
        cve.description = `${cve.description.replace(/\"/g, "'")}`;
        cve.tags = cve.tags || '';
        cve.last_modified_timestamp = new Date(
          cve.last_modified_timestamp * 1000
        );
        cve.published_timestamp = new Date(cve.published_timestamp * 1000);
        return {
          name: cve.name,
          description: cve.description,
          link: cve.link,
          score: cve.score,
          score_v3: cve.score_v3,
          severity: cve.severity,
          vectors: cve.vectors,
          vectors_v3: cve.vectors_v3,
          feed_rating: cve.feed_rating,
          file_name: cve.file_name,
          package_name: cve.package_name,
          package_version: cve.package_version,
          fixed_version: cve.fixed_version,
          tags: cve.tags,
          published_timestamp: cve.published_timestamp,
          last_modified_timestamp: cve.last_modified_timestamp,
        };
      });
      const csv = arrayToCsv(cves4Csv, title);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const filename = `vulnerabilities-${
        this.path + this.repository
      }_${this.utilsService.parseDatetimeStr(new Date())}.csv`;
      saveAs(blob, filename);
    }
  }
  changeScoreView(val: string) {
    this.selectedVulScore = val;
    if (val === 'V2') {
      this.vulGrid.gridApi?.setColumnsVisible(['score_v3'], false);
      this.vulGrid.gridApi?.setColumnsVisible(['score'], true);
    } else {
      this.vulGrid.gridApi?.setColumnsVisible(['score'], false);
      this.vulGrid.gridApi?.setColumnsVisible(['score_v3'], true);
    }
    this.vulGrid.gridApi.sizeColumnsToFit();
    this.cd.markForCheck();
  }

  private prepareLayerCsvData(layerCves): any {
    return layerCves
      .map(layerCve => {
        if (layerCve.vulnerabilities && layerCve.vulnerabilities.length > 0) {
          return layerCve.vulnerabilities.map((vulnerability, index) => {
            if (index === 0) {
              return Object.assign({ digest: layerCve.digest }, vulnerability);
            } else {
              return Object.assign({ digest: '' }, vulnerability);
            }
          });
        }
      })
      .filter(layerCve => !!layerCve)
      .flatMap(x => x);
  }
}
