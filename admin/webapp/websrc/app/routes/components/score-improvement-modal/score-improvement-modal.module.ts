import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ScoreImprovementModalComponent } from './score-improvement-modal.component';
import { ScorePredictionHeaderComponent } from './partial/score-prediction-header/score-prediction-header.component';
import { ScoreImprovementGeneralComponent } from './partial/score-improvement-general/score-improvement-general.component';
import { ScoreImprovementServiceRiskViewComponent } from './partial/score-improvement-service-risk-view/score-improvement-service-risk-view.component';
import { ScoreImprovementExposureViewComponent } from './partial/score-improvement-exposure-view/score-improvement-exposure-view.component';
import { ScoreImprovementRunAsRootContainersViewComponent } from './partial/score-improvement-run-as-root-containers-view/score-improvement-run-as-root-containers-view.component';
import { ScoreImprovementRunAsPrivilegedContainersViewComponent } from './partial/score-improvement-run-as-privileged-containers-view/score-improvement-run-as-privileged-containers-view.component';
import { ScoreImprovementAdmissionControlStatusViewComponent } from './partial/score-improvement-admission-control-status-view/score-improvement-admission-control-status-view.component';
import { ScoreImprovementCompletedViewComponent } from './partial/score-improvement-completed-view/score-improvement-completed-view.component';
import { NgxGaugeModule } from 'ngx-gauge';
import { ScoreImprovementGeneralHeaderComponent } from './partial/score-improvement-general/score-improvement-general-header/score-improvement-general-header.component';
import { ScoreImprovementGeneralListItemComponent } from './partial/score-improvement-general/score-improvement-general-list-item/score-improvement-general-list-item.component';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';
import { SettingsService } from '@services/settings.service';
import { GroupsModule } from '@components/groups/groups.module';
import { GroupDetailsModule } from '@components/group-details/group-details.module';
import { ExposureGridModule } from '@components/exposure-grid/exposure-grid.module';
import { ContainersGridModule } from '@components/containers-grid/containers-grid.module';
import { ContainerDetailModule } from '@components/container-detail/container-detail.module';

@NgModule({
  declarations: [
    ScoreImprovementModalComponent,
    ScorePredictionHeaderComponent,
    ScoreImprovementGeneralComponent,
    ScoreImprovementGeneralHeaderComponent,
    ScoreImprovementGeneralListItemComponent,
    ScoreImprovementServiceRiskViewComponent,
    ScoreImprovementExposureViewComponent,
    ScoreImprovementRunAsRootContainersViewComponent,
    ScoreImprovementRunAsPrivilegedContainersViewComponent,
    ScoreImprovementAdmissionControlStatusViewComponent,
    ScoreImprovementCompletedViewComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgxGaugeModule,
    GroupsModule,
    GroupDetailsModule,
    ExposureGridModule,
    ContainersGridModule,
    ContainerDetailModule,
  ],
  providers: [ScoreImprovementModalService, SettingsService],
})
export class ScoreImprovementModalModule {}
