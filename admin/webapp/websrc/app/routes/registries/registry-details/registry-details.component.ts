import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RegistriesCommunicationService } from '../regestries-communication.service';
import { FormControl } from '@angular/forms';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-registry-details',
  templateUrl: './registry-details.component.html',
  styleUrls: ['./registry-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsComponent {
  error: unknown;
  @Input() gridHeight!: number;
  filter = new FormControl('');
  registryDetails$ = this.registriesCommunicationService.registryDetails$.pipe(
    catchError(err => {
      this.error = err;
      throw err;
    })
  );

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService
  ) {}
}
