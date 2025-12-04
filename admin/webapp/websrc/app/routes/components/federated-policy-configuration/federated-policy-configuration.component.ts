import {
  Component,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { ComponentCanDeactivate } from '@common/guards/pending-changes.guard';
import { FederatedConfigFormComponent } from '@components/federated-policy-configuration/federated-config-form/federated-config-form.component';
import { FederatedConfiguration } from '@common/types';
import { FederatedConfigurationService } from '@services/federated-configuration.service';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalConstant } from '@common/constants/global.constant';


@Component({
  standalone: false,
  selector: 'app-federated-policy-configuration',
  templateUrl: './federated-policy-configuration.component.html',
  styleUrls: ['./federated-policy-configuration.component.scss'],
  
})
export class FederatedPolicyConfigurationComponent
  implements OnInit, ComponentCanDeactivate
{
  config!: FederatedConfiguration;
  refreshing = new EventEmitter<boolean>();
  @ViewChild(FederatedConfigFormComponent)
  fedConfigForm!: FederatedConfigFormComponent;
  isConfigAuthorized!: boolean;
  isImportAuthorized!: boolean;
  GlobalConstant = GlobalConstant;

  @Input() source!: string;

  constructor(
    private federatedConfigurationService: FederatedConfigurationService,
    private tr: TranslateService,
    private authUtils: AuthUtilsService
  ) {}

  ngOnInit(): void {
    this.isConfigAuthorized = this.authUtils.getDisplayFlag('write_config');
    this.isImportAuthorized =
      GlobalVariable.user.token.role === MapConstant.FED_ROLES.FEDADMIN ||
      (GlobalVariable.user.token.role === MapConstant.FED_ROLES.ADMIN &&
        (GlobalVariable.isStandAlone || GlobalVariable.isMember));
    this.refresh();
  }

  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    return this.fedConfigForm?.fedConfigForm?.dirty
      ? confirm(this.tr.instant('setting.webhook.LEAVE_PAGE'))
      : true;
  }

  refresh(): void {
    this.refreshing.emit(true);
    this.federatedConfigurationService.getFederatedConfig().subscribe({
      next: value => {
        this.config = value.fed_config;
        this.refreshing.emit(false);
      },
    });
  }
}
