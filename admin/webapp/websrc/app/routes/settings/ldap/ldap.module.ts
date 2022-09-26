import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LdapComponent } from './ldap.component';
import { RouterModule, Routes } from '@angular/router';
import { SettingsService } from '@services/settings.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { LdapFormComponent } from './ldap-form/ldap-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { GroupDomainRoleModule } from '../common/group-domain-role/group-domain-role.module';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { TestConnectionDialogComponent } from './test-connection-dialog/test-connection-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { ObserveModule } from '@common/directives/observe/observe.module';

const routes: Routes = [
  { path: '', component: LdapComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [
    LdapComponent,
    LdapFormComponent,
    TestConnectionDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    GroupDomainRoleModule,
    MatDialogModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    ObserveModule,
  ],
  providers: [SettingsService],
})
export class LdapModule {}
