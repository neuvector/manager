import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenidComponent } from './openid.component';
import { OpenidFormComponent } from './openid-form/openid-form.component';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { GroupDomainRoleModule } from '../common/group-domain-role/group-domain-role.module';
import { SettingsService } from '@services/settings.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';

const routes: Routes = [
  { path: '', component: OpenidComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [OpenidComponent, OpenidFormComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatCardModule,
    MatCheckboxModule,
    ClipboardModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    GroupDomainRoleModule,
    LoadingTemplateModule,
  ],
  providers: [SettingsService],
})
export class OpenidModule {}
