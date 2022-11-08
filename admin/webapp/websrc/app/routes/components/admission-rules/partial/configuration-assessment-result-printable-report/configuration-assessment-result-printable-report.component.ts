import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-configuration-assessment-result-printable-report',
  templateUrl: './configuration-assessment-result-printable-report.component.html',
  styleUrls: ['./configuration-assessment-result-printable-report.component.scss']
})
export class ConfigurationAssessmentResultPrintableReportComponent implements OnInit {

  @Input() testResult: any;

  constructor() { }

  ngOnInit(): void {
  }

}
