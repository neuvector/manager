import { Component, OnInit } from '@angular/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { MultiClusterService } from '@services/multi-cluster.service';


@Component({
  standalone: false,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  
})
export class SettingsComponent implements OnInit {
  columns!: number;
  isConfigAuth!: boolean;
  isAuthenticationAuth!: boolean;
  isNamespaceUser!: boolean;

  get isWorker() {
    return GlobalVariable.isRemote;
  }

  constructor(
    private authUtils: AuthUtilsService,
    private multiClusterService: MultiClusterService
  ) {}

  breakPoints(): void {
    switch (true) {
      case window.innerWidth <= 640:
        this.columns = 1;
        break;
      case window.innerWidth > 640 && window.innerWidth <= 1024:
        this.columns = 2;
        break;
      default:
        this.columns = 3;
    }
  }

  ngOnInit(): void {
    this.breakPoints();
    this.getParameters();

    this.multiClusterService.onGetClustersFinishEvent$.subscribe(() => {
      this.getParameters();
    });
  }

  getParameters(): void {
    this.isConfigAuth = this.authUtils.getDisplayFlag('read_config');
    this.isAuthenticationAuth =
      this.authUtils.getDisplayFlag('read_auth_server');
    this.isNamespaceUser = this.authUtils.userPermission.isNamespaceUser;
  }

  onResize(): void {
    this.breakPoints();
  }
}
