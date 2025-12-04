import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-panel-instruction-curtain',
  templateUrl: './panel-instruction-curtain.component.html',
  styleUrls: ['./panel-instruction-curtain.component.scss'],
})
export class PanelInstructionCurtainComponent {
  @Input() instructions: string[];

  constructor() {}
}
