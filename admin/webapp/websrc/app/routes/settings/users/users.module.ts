import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users.component';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PasswordPanelModule } from '../common/password-panel/password-panel.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { UsersGridModule } from '@components/users-grid/users-grid.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { SettingsService } from '@services/settings.service';
import { RolesGridModule } from '@components/roles-grid/roles-grid.module';
import { PasswordProfileComponent } from './password-profile/password-profile.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { NeuVectorFormlyModule } from '@common/neuvector-formly/neuvector-formly.module';

const routes: Routes = [
  { path: '', component: UsersComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [UsersComponent, PasswordProfileComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslateModule,
    ReactiveFormsModule,
    PasswordPanelModule,
    MatCardModule,
    MatTabsModule,
    LoadingTemplateModule,
    LoadingButtonModule,
    UsersGridModule,
    RolesGridModule,
    NeuVectorFormlyModule,
  ],
  providers: [SettingsService],
})
export class UsersModule {}
