import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { LicenseComponent } from './license.component';
import { MatCardModule } from '@angular/material/card';
import { RouterModule, Routes } from '@angular/router';
import { SettingsService } from '@services/settings.service';
import { LicenseInfoComponent } from './license-info/license-info.component';
import { LicenseRenewComponent } from './license-renew/license-renew.component';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', component: LicenseComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [LicenseComponent, LicenseInfoComponent, LicenseRenewComponent],
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  providers: [SettingsService],
})
export class LicenseModule {}
