import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  RegistriesCommunicationService,
  RegistryDetails,
} from '../regestries-communication.service';
import { FormControl } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { UtilsService } from '@common/utils/app.utils';

@Component({
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
  registryDetails$ = this.registriesCommunicationService.registryDetails$.pipe(
    catchError(err => {
      this.error = err;
      throw err;
    })
  );

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService,
    private utils: UtilsService
  ) {}

  exportCSV(registryDetails: RegistryDetails): void {
    let images4Csv = registryDetails.repositories.images.map(image => ({
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
}
