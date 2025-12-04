import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  RegistriesCommunicationService,
  RegistryDetails,
} from '../regestries-communication.service';
import { FormControl } from '@angular/forms';
import { catchError, tap } from 'rxjs/operators';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { UtilsService } from '@common/utils/app.utils';
import { RegistriesService } from '@services/registries.service';


@Component({
  standalone: false,
  selector: 'app-registry-details',
  templateUrl: './registry-details.component.html',
  styleUrls: ['./registry-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class RegistryDetailsComponent {
  error: unknown;
  @Input() gridHeight!: number;
  @Input() linkedImage: string;
  @Input() linkedTag: string;
  filter = new FormControl('');
  queryToken: string;
  registryDetails$ = this.registriesCommunicationService.registryDetails$.pipe(
    tap(res => {
      if (!!res.isAllView)
        this.queryToken = res.allScannedImagesSummary!.queryToken;
    }),
    catchError(err => {
      this.error = err;
      throw err;
    })
  );

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService,
    private registriesService: RegistriesService,
    private utils: UtilsService
  ) {
    this.registriesCommunicationService.detailFilter = this.filter;
  }

  exportCSV(registryDetails: RegistryDetails): void {
    let images4Csv = registryDetails.repositories?.images.map(image => ({
      repository: image.tag
        ? `${image.repository}:${image.tag}`
        : image.repository,
      image_id: image.image_id,
      created_at: image.created_at,
      base_os: image.base_os,
      size: image.size,
      high: image.high,
      medium: image.medium,
      status: image.status,
      scanned_at: image.scanned_at,
    }));
    const imagesCSV = arrayToCsv(images4Csv);
    const blob = new Blob([imagesCSV], { type: 'text/csv;charset=utf-8' });
    saveAs(
      blob,
      `registry-vulnerabilities-${
        registryDetails.selectedRegistry.name
      }_${this.utils.parseDatetimeStr(new Date())}.csv`
    );
  }

  exportAllScannedImagesCSV(): void {
    this.registriesService
      .getAllScannedImages(this.queryToken, 0, -1, [], {
        '-': { filter: this.filter.value },
      })
      .subscribe(res => {
        console.log('csv', res);
        let images4Csv = res.data.map(image => ({
          repository: image.tag
            ? `${image.repository}:${image.tag}`
            : image.repository,
          image_id: image.image_id,
          created_at: image.created_at,
          base_os: image.base_os,
          size: image.size,
          high: image.high,
          medium: image.medium,
          status: image.status,
          scanned_at: image.scanned_at,
        }));
        const imagesCSV = arrayToCsv(images4Csv);
        const blob = new Blob([imagesCSV], { type: 'text/csv;charset=utf-8' });
        saveAs(
          blob,
          `vulnerabilities of all scanned images_${this.utils.parseDatetimeStr(
            new Date()
          )}.csv`
        );
      });
  }
}
