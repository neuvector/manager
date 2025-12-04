import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Group, HierarchicalExposure } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';


interface ExposureData {
  ingress: HierarchicalExposure[];
  egress: HierarchicalExposure[];
}

type ExposureFilter = 'threat' | 'violation' | 'normal';

@Component({
  standalone: false,
  selector: 'app-score-improvement-exposure-view',
  templateUrl: './score-improvement-exposure-view.component.html',
  styleUrls: ['./score-improvement-exposure-view.component.scss'],
  
})
export class ScoreImprovementExposureViewComponent implements OnInit {
  @ViewChild('stepper', { static: true }) stepper!: MatStepper;
  @Input() isGlobalUser!: boolean;
  get score() {
    return this.scoreImprovementModalService.score;
  }
  projectedScore!: number;
  selectedIndex: number = 0;
  stepControls = this.fb.group({
    mode: null,
    threat: null,
    violation: null,
    session: null,
  });
  selectedGroup!: Group | null;
  selectedIndex4Exposure = {
    threat: 0,
    violation: 0,
    normal: 0,
  };
  exposureData!: ExposureData;
  displayExposure: {
    threat: ExposureData;
    violation: ExposureData;
    normal: ExposureData;
  } = {
    threat: {
      ingress: [],
      egress: [],
    },
    violation: {
      ingress: [],
      egress: [],
    },
    normal: {
      ingress: [],
      egress: [],
    },
  };

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService,
    private fb: FormBuilder,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.getPredictionScores();
    this.exposureData = this.scoreImprovementModalService.prepareExposureData();
  }

  next(): void {
    if (this.stepper) this.stepper.next();
  }

  getPredictionScores() {
    const metrics = JSON.parse(
      JSON.stringify(this.scoreImprovementModalService.newMetrics())
    );
    metrics.new_service_policy_mode = 'Protect';
    metrics.groups.protect_groups +=
      metrics.groups.discover_groups + metrics.groups.monitor_groups;
    metrics.groups.monitor_groups = 0;
    metrics.groups.discover_groups = 0;
    metrics.workloads.protect_ext_eps +=
      metrics.workloads.discover_ext_eps + metrics.workloads.monitor_ext_eps;
    metrics.workloads.monitor_ext_eps = 0;
    metrics.workloads.discover_ext_eps = 0;
    metrics.workloads.threat_ext_eps = 0;
    metrics.workloads.violate_ext_eps = 0;
    metrics.groups.discover_groups_zero_drift = 0;
    this.scoreImprovementModalService
      .calculateScoreData(metrics)
      .subscribe(scores => {
        this.projectedScore = scores.security_scores.security_risk_score;
      });
  }

  getMessage(): string {
    return this.tr.instant(
      `dashboard.improveScoreModal.exposure.DESCRIPTION_${
        this.selectedIndex + 1
      }`
    );
  }

  generateGridData(filter: ExposureFilter): void {
    const exposureData = {
      ingress: this.filterExposedConversations(
        this.exposureData.ingress,
        filter
      ),
      egress: this.filterExposedConversations(this.exposureData.egress, filter),
    };
    this.displayExposure[filter] = exposureData;
    if (exposureData.ingress.length === 0 && exposureData.egress.length > 0) {
      this.selectedIndex4Exposure[filter] = 1;
    }
  }

  filterExposedConversations(
    exposure: HierarchicalExposure[],
    filter: ExposureFilter
  ): HierarchicalExposure[] {
    let res: HierarchicalExposure[] = [];
    if (exposure && exposure.length > 0) {
      exposure.forEach(conversation => {
        let children = [] as any;
        if (conversation.children && conversation.children.length > 0) {
          children = conversation.children.filter(child => {
            if (filter === 'threat' && child.severity) {
              return true;
            } else if (
              filter === 'violation' &&
              ((child.policy_action &&
                child.policy_action.toLowerCase() === 'violate') ||
                child.policy_action.toLowerCase() === 'deny')
            ) {
              return true;
            } else if (
              filter === 'normal' &&
              (!child.severity || child.severity.length === 0) &&
              (!child.policy_action ||
                (child.policy_action.toLowerCase() !== 'violate' &&
                  child.policy_action.toLowerCase() !== 'deny'))
            ) {
              return true;
            }
            return false;
          });
        }
        if (children.length > 0) {
          conversation.children = children;
          res.push(conversation);
        }
      });
    }
    return res;
  }

  setSelectedGroup(service: Group | null) {
    this.selectedGroup = null;
    setTimeout(() => {
      this.selectedGroup = service;
    });
  }

  selectionChange(event: StepperSelectionEvent) {
    this.selectedIndex = event.selectedIndex;
    switch (this.selectedIndex) {
      case 1:
        this.generateGridData('threat');
        break;
      case 2:
        this.generateGridData('violation');
        break;
      case 3:
        this.generateGridData('normal');
        break;
    }
  }
}
