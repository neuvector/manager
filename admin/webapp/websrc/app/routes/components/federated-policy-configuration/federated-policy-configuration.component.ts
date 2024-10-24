import {
  Component,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { repeatWhen } from 'rxjs/operators';
import { ComponentCanDeactivate } from '@common/guards/pending-changes.guard';
import { FederatedConfigFormComponent } from '@components/federated-policy-configuration/federated-config-form/federated-config-form.component';
import { FederatedConfiguration } from '@common/types';
import { FederatedConfigurationService } from '@services/federated-configuration.service';

@Component({
  selector: 'app-federated-policy-configuration',
  templateUrl: './federated-policy-configuration.component.html',
  styleUrls: ['./federated-policy-configuration.component.scss'],
})
export class FederatedPolicyConfigurationComponent
  implements OnInit, ComponentCanDeactivate
{
  config!: FederatedConfiguration;
  refreshConfig$ = new Subject();
  @ViewChild(FederatedConfigFormComponent)
  fedConfigForm!: FederatedConfigFormComponent;

  @Input() source!: string;

  constructor(
    private federatedConfigurationService: FederatedConfigurationService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.federatedConfigurationService
      .getFederatedConfig()
      .pipe(repeatWhen(() => this.refreshConfig$))
      .subscribe({
        next: value => {
          this.config = value.fed_config;
        },
      });
  }

  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    return this.fedConfigForm?.fedConfigForm?.dirty
      ? confirm(this.tr.instant('setting.webhook.LEAVE_PAGE'))
      : true;
  }

  refreshConfig(): void {
    this.refreshConfig$.next(true);
  }
}
