import { Injectable } from '@angular/core';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { GlobalVariable } from '@common/variables/global.variable';
import { DashboardService } from '@services/dashboard.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardBasicDataResolver implements Resolve<any> {

  constructor(private dashboardService: DashboardService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.dashboardService.getBasicData(GlobalVariable.user?.global_permissions.length > 0);
  }
}
