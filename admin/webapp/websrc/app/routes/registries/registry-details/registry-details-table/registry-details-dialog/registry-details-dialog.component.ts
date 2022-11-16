import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RegistriesService } from '@services/registries.service';
import { RegistryDetailsTableComponent } from '../registry-details-table.component';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { delay, map, mergeMap, take, tap } from 'rxjs/operators';
import {
  Check,
  EntryPostBody,
  ErrorResponse,
  Image,
  ImageGetResponse,
  LayerGetResponse,
  Summary,
  Vulnerability,
} from '@common/types';
import { FormControl } from '@angular/forms';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { RemediationDetailDialogComponent } from '@components/compliance-grid/remediation-detail-dialog/remediation-detail-dialog.component';

export interface RegistryDetailsDialogData {
  selectedRegistry: Summary;
  image: Image;
}

@Component({
  selector: 'app-registry-details-dialog',
  templateUrl: './registry-details-dialog.component.html',
  styleUrls: ['./registry-details-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsDialogComponent implements OnInit {
  acceptedVulnerabilityStatus = false;
  resize = true;
  refreshing = false;
  imageAndLayers$!: Observable<any>;
  totalCountText = 5;
  filteredCountText = 0;
  filter = new FormControl('');
  private toggleViewSubject$ = new BehaviorSubject<boolean>(false);
  @ViewChild(RemediationDetailDialogComponent)
  remediationDetails!: RemediationDetailDialogComponent;
  selectedRemediation!: Check;
  get registryTitle() {
    return `${this.data.selectedRegistry.registry}${this.data.image.repository}:${this.data.image.tag}`;
  }

  constructor(
    public dialogRef: MatDialogRef<RegistryDetailsTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegistryDetailsDialogData,
    private registriesService: RegistriesService,
    private cd: ChangeDetectorRef,
    private quickFilterService: QuickFilterService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private tr: TranslateService
  ) {}

  imageAndLayer(
    acceptedVulnerabilityStatus: boolean
  ): Observable<{ image: ImageGetResponse; layer: LayerGetResponse }> {
    return combineLatest([
      this.registriesService.getImage(
        this.data.selectedRegistry.name,
        this.data.image.image_id,
        acceptedVulnerabilityStatus
      ),
      this.registriesService.getLayer(
        this.data.selectedRegistry.name,
        this.data.image.image_id,
        acceptedVulnerabilityStatus
      ),
    ]).pipe(
      map(([image, layer]) => {
        layer.report.layers.unshift({
          cmds: image.report.cmds.join(','),
          digest: this.data.image.digest,
          size: 0,
          vulnerabilities: image.report.vulnerabilities,
        });
        return {
          image,
          layer,
        };
      })
    );
  }

  ngOnInit(): void {
    this.filter.valueChanges
      .pipe(tap((value: string) => this.quickFilterService.setTextInput(value)))
      .subscribe();
    this.imageAndLayers$ = this.toggleViewSubject$.pipe(
      tap(bool => (this.acceptedVulnerabilityStatus = bool)),
      mergeMap(bool => this.imageAndLayer(bool)),
      tap(() => {
        this.refreshing = false;
        this.cd.markForCheck();
      })
    );
  }

  resizeChildGrids(): void {
    this.resize = !this.resize;
  }

  onAcceptVulnerability(vulnerability: Vulnerability): void {
    const date = new Date().toString().split(' ').slice(0, 5);
    date[2] = date[2] + ',';
    const body: EntryPostBody = {
      config: {
        entries: [
          {
            name: vulnerability.name,
            days: 0,
            comment: `Vulnerability was accepted on ${
              this.data.image.repository
            } at ${date.join(' ')} from Registries page`,
            images: [`${this.data.image.repository}:${this.data.image.tag}`],
            domains: [],
          },
        ],
        name: 'default',
      },
    };
    this.refreshing = true;
    this.registriesService
      .acceptVulnerability(body)
      .pipe(take(1), delay(1000))
      .subscribe({
        next: () => {
          this.toggleViewSubject$.next(this.acceptedVulnerabilityStatus);
          this.notificationService.open(
            this.tr.instant('cveProfile.msg.ADD_OK')
          );
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              error,
              this.tr.instant('cveProfile.msg.ADD_NG'),
              false
            )
          );
        },
      });
  }

  toggleAcceptedVulnerability(): void {
    this.refreshing = true;
    this.toggleViewSubject$.next(!this.acceptedVulnerabilityStatus);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openRemediation(data: Check) {
    this.selectedRemediation = data;
    this.remediationDetails.show();
  }
}
