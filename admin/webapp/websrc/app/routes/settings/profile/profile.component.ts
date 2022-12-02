import { Component, ViewChild } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  @ViewChild(ProfileFormComponent) profileForm!: ProfileFormComponent;
  profileError: unknown;
  user$ = this.settingsService.getSelf().pipe(
    catchError(err => {
      this.profileError = err;
      return throwError(err);
    })
  );

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {}
}
