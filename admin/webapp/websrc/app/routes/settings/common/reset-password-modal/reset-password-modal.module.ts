import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResetPasswordModalComponent } from './reset-password-modal.component';
import { PasswordPanelModule } from '../password-panel/password-panel.module';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [ResetPasswordModalComponent],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    LoadingButtonModule,
    PasswordPanelModule,
  ],
  exports: [ResetPasswordModalComponent],
})
export class ResetPasswordModalModule {}
