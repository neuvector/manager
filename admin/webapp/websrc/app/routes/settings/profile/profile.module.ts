import { NgModule } from '@angular/core';
import { ProfileComponent } from './profile.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TranslatorService } from '@core/translator/translator.service';
import { SettingsService } from '@services/settings.service';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { PasswordPanelModule } from '../common/password-panel/password-panel.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AvatarModule } from 'ngx-avatars';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';

const routes: Routes = [{ path: '', component: ProfileComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AvatarModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    PasswordPanelModule,
    TranslateModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  declarations: [ProfileComponent, ProfileFormComponent],
  exports: [RouterModule],
  providers: [TranslatorService, SettingsService],
})
export class ProfileModule {}
