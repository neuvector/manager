import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { SignatureVerifiersComponent } from './signature-verifiers.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { QuickFilterModule } from "@components/quick-filter/quick-filter.module";
import { AgGridModule } from 'ag-grid-angular';
import { PipeModule } from "@common/pipes/pipe.module";
import { AddEditSignatureVerifiersModalComponent } from './partial/add-edit-signature-verifiers-modal/add-edit-signature-verifiers-modal.component';
import { SignatureActionButtonsComponent } from './partial/signature-action-buttons/signature-action-buttons.component';
import { VerifierActionButtonsComponent } from './partial/verifier-action-buttons/verifier-action-buttons.component';
import { AddEditVerifiersModalComponent } from './partial/add-edit-verifiers-modal/add-edit-verifiers-modal.component';

const routes: Routes = [{ path: '', component: SignatureVerifiersComponent }];

@NgModule({
  declarations: [
    SignatureVerifiersComponent,
    AddEditSignatureVerifiersModalComponent,
    SignatureActionButtonsComponent,
    VerifierActionButtonsComponent,
    AddEditVerifiersModalComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    LoadingButtonModule,
    AdjustableDivModule,
    QuickFilterModule,
    AgGridModule,
    PipeModule,
  ]
})
export class SignatureVerifiersModule { }
