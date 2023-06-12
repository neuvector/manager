import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NvCommonModule } from '../../common/nvCommon.module';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { EulaComponent } from './login/eula/eula.component';
import { AgreementComponent } from './login/eula/agreement/agreement.component';
import { FrameModule } from "../../frame/frame.module";

/* Use this routes definition in case you want to make them lazy-loaded */
/*const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'recover', component: RecoverComponent },
    { path: 'lock', component: LockComponent },
    { path: 'maintenance', component: MaintenanceComponent },
    { path: '404', component: Error404Component },
    { path: '500', component: Error500Component },
];*/

@NgModule({
    imports: [
        NvCommonModule,
        FrameModule,
        // RouterModule.forChild(routes)
    ],
  declarations: [LoginComponent, LogoutComponent, EulaComponent, AgreementComponent],
  exports: [RouterModule, LoginComponent, LogoutComponent],
})
export class PagesModule {}
