import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SamlComponent } from './saml.component';
import { SamlFormComponent } from './saml-form/saml-form.component';
import { GroupDomainRoleModule } from '../common/group-domain-role/group-domain-role.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, Routes } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { SettingsService } from '@services/settings.service';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';

const routes: Routes = [
  { path: '', component: SamlComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [SamlComponent, SamlFormComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    ClipboardModule,
    GroupDomainRoleModule,
    LoadingTemplateModule,
  ],
  providers: [SettingsService],
})
export class SamlModule {}
