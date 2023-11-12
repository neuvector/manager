import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVariable } from '@common/variables/global.variable';
import { AuthService } from '@common/services/auth.service';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  isSUSESSO: boolean;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isSUSESSO = GlobalVariable.isSUSESSO;
    if (!this.isSUSESSO) {
      this.auth.logout(false, false);
    }
  }
}
