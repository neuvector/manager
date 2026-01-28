import { Component, Input, OnInit } from '@angular/core';
import { ContainersService } from '@common/services/containers.service';

@Component({
  standalone: false,
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss'],
})
export class MembersComponent implements OnInit {
  @Input() source: string = '';
  @Input() groupName: string = '';
  @Input() resizableHeight: number = 0;
  @Input() members: any;
  @Input() kind: string = '';
  @Input() useQuickFilterService: boolean = false;
  memberGridRowData: any;

  constructor(private containersService: ContainersService) {}

  ngOnInit(): void {
    this.memberGridRowData =
      this.kind === 'node'
        ? this.members
        : this.containersService.formatScannedWorkloads(this.members);
  }
}
