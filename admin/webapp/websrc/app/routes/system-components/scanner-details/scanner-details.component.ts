import { Component, OnInit } from '@angular/core';
import { Scanner } from '@common/types';
import { Subscription } from 'rxjs';
import { SystemComponentsCommunicationService } from '../system-components-communication.service';

@Component({
  standalone: false,
  selector: 'app-scanner-details',
  templateUrl: './scanner-details.component.html',
  styleUrls: ['./scanner-details.component.scss'],
})
export class ScannerDetailsComponent implements OnInit {
  currentScanner!: Scanner | undefined;
  activeScannerSub!: Subscription;

  constructor(
    private componentsCommunicationService: SystemComponentsCommunicationService
  ) {}

  ngOnInit(): void {
    this.componentsCommunicationService.selectedScanner$.subscribe(scanner => {
      this.currentScanner = scanner;
    });
  }
}
