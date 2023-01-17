import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RegistriesCommunicationService } from '../regestries-communication.service';
import { UntypedFormControl } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RepoGetResponse, Summary } from '@common/types';

interface RegistryDetails {
  selectedRegistry: Summary;
  repositories: RepoGetResponse;
}

@Component({
  selector: 'app-registry-details',
  templateUrl: './registry-details.component.html',
  styleUrls: ['./registry-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsComponent {
  error: unknown;
  @Input() gridHeight!: number;
  filter = new UntypedFormControl('');
  registryDetails$: Observable<RegistryDetails>

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService
  ) {
    this.registryDetails$ = this.registriesCommunicationService.registryDetails$.pipe(
      catchError(err => {
        this.error = err;
        throw err;
      })
    );
  }
}
