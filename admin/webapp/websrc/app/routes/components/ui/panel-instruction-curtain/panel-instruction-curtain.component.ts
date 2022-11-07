import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-panel-instruction-curtain',
  templateUrl: './panel-instruction-curtain.component.html',
  styleUrls: ['./panel-instruction-curtain.component.scss']
})
export class PanelInstructionCurtainComponent implements OnInit {

  @Input() instructions: string[];

  constructor() { }

  ngOnInit(): void {
  }

}
