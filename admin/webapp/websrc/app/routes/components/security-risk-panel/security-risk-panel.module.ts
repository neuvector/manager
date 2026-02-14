import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { SecurityRiskPanelComponent } from './security-risk-panel.component';
import { RiskScoreComponent } from './partial/risk-score/risk-score.component';
import { RiskFactorComponent } from './partial/risk-factor/risk-factor.component';
import { RiskInstructionComponent } from './partial/risk-instruction/risk-instruction.component';
import { NgxGaugeModule } from 'ngx-gauge';
import { VulnerabilityInstructionComponent } from './partial/vulnerability-instruction/vulnerability-instruction.component';
import { ScoreInstructionComponent } from './partial/score-instruction/score-instruction.component';
import { ScoreImprovementModalModule } from '@components/score-improvement-modal/score-improvement-modal.module';

@NgModule({
  declarations: [
    SecurityRiskPanelComponent,
    RiskScoreComponent,
    RiskFactorComponent,
    RiskInstructionComponent,
    VulnerabilityInstructionComponent,
    ScoreInstructionComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgxGaugeModule,
    ScoreImprovementModalModule,
  ],
  exports: [
    SecurityRiskPanelComponent,
    RiskScoreComponent,
    VulnerabilityInstructionComponent,
  ],
})
export class SecurityRiskPanelModule {}
