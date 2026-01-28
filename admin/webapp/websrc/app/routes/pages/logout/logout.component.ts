import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVariable } from '@common/variables/global.variable';
import { AuthService } from '@common/services/auth.service';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';

@Component({
  standalone: false,
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  isSUSESSO: boolean;

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isSUSESSO = GlobalVariable.isSUSESSO;
    if (!this.isSUSESSO) {
      this.auth.logout(false, false);
    }
  }
  gotoLogin = () => {
    this.sessionStorage.clear();
    this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF);
    this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TIMEOUT);
    this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_CLUSTER);
    this.router.navigate([GlobalConstant.PATH_LOGIN]);
  };
}
