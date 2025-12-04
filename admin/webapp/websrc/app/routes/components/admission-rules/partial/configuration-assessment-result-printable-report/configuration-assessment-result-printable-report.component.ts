import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-configuration-assessment-result-printable-report',
  templateUrl:
    './configuration-assessment-result-printable-report.component.html',
  styleUrls: [
    './configuration-assessment-result-printable-report.component.scss',
  ],
  
})
export class ConfigurationAssessmentResultPrintableReportComponent
  implements OnInit
{
  @Input() testResult: any;
  colourMap: any = MapConstant.colourMap;
  Array = Array;

  constructor() {}

  ngOnInit(): void {
    console.log('testResult', this.testResult);
  }
}
