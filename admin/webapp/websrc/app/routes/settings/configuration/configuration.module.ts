import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ConfigurationComponent } from './configuration.component';
import { RouterModule, Routes } from '@angular/router';
import { SettingsService } from '@services/settings.service';
import { ConfigFormComponent } from './config-form/config-form.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { NeuVectorFormlyModule } from '@common/neuvector-formly/neuvector-formly.module';
import { ObserveModule } from '@common/directives/observe/observe.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { ExportFormComponent } from './export-form/export-form.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ImportFileModule } from '@components/ui/import-file/import-file.module';
import { SupportFormComponent } from './support-form/support-form.component';
import { EnforcersGridModule } from '@components/enforcers-grid/enforcers-grid.module';
import { PendingChangesGuard } from '@common/guards/pending-changes.guard';
import { NvCommonModule } from '@common/nvCommon.module';
import { CspSupportFormComponent } from './csp-support-form/csp-support-form.component';
import { RemoteRepositoryFormComponent } from './remote-repository-form/remote-repository-form.component';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationComponent,
    canDeactivate: [PendingChangesGuard],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [
    ConfigurationComponent,
    ConfigFormComponent,
    ExportFormComponent,
    SupportFormComponent,
    CspSupportFormComponent,
    RemoteRepositoryFormComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSelectModule,
    MatDividerModule,
    MatCheckboxModule,
    NeuVectorFormlyModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    ImportFileModule,
    ObserveModule,
    EnforcersGridModule,
  ],
  providers: [SettingsService],
})
export class ConfigurationModule {}
