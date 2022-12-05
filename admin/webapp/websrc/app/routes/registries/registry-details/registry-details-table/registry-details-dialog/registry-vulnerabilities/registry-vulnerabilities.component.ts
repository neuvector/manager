import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Layer, Vulnerability } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { cloneDeep } from 'lodash';
import { saveAs } from 'file-saver';
import { arrayToCsv, isVulAccepted } from '@common/utils/common.utils';

@Component({
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
      this._layers.some(l => l.vulnerabilities.length > 0);
  }
  get layers() {
    return this._layers;
  }
  hasLayers!: boolean;
  @Input() refreshing!: boolean;
  @Input() resize!: boolean;
  @Output() showAcceptedVulnerability = new EventEmitter<boolean>();
  @Output() acceptVulnerability = new EventEmitter<Vulnerability>();
  @Input() acceptedVulnerabilityStatus!: boolean;
  selectedLayer!: Layer;
  selectedVulnerability!: Vulnerability;

  constructor(private utilsService: UtilsService) {}

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
      } |  ${this.cveDBVersion} | ${this.scannerDate.replace(
        /\,/g,
        ' '
      )} | OS: ${this.baseOS}`;
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
      this.selectedLayer.vulnerabilities &&
      this.selectedLayer.vulnerabilities.length > 0
    ) {
      const title = `${this.path + this.repository} | Image Id: ${
        this.imageId
      } |  ${this.cveDBVersion} | ${this.scannerDate.replace(
        /\,/g,
        ' '
      )} | OS: ${this.baseOS}`;
      let cves4Csv: any = cloneDeep(this.selectedLayer.vulnerabilities);
      cves4Csv = cves4Csv.map(cve => {
        cve.description = `${cve.description.replace(/\"/g, "'")}`;
        cve.tags = cve.tags || '';
        cve.last_modified_timestamp = new Date(
          cve.last_modified_timestamp * 1000
        );
        cve.published_timestamp = new Date(cve.published_timestamp * 1000);
        return cve;
      });
      const csv = arrayToCsv(cves4Csv, title);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const filename = `vulnerabilities-${
        this.path + this.repository
      }_${this.utilsService.parseDatetimeStr(new Date())}.csv`;
      saveAs(blob, filename);
    }
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
