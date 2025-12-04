import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';

import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { AccordionModule } from 'ngx-bootstrap/accordion';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { RatingModule } from 'ngx-bootstrap/rating';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { CookieService } from 'ngx-cookie-service';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ColorsService } from './colors/colors.service';

import { UtilsService } from './utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { AuthUtilsService } from './utils/auth.utils';

import { AuthService } from '@services/auth.service';
import { GroupsService } from '@services/groups.service';
import { ProcessProfileRulesService } from '@services/process-profile-rules.service';
import { FileAccessRulesService } from '@services/file-access-rules.service';
import { ResponseRulesService } from '@services/response-rules.service';
import { AdmissionRulesService } from '@services/admission-rules.service';
import { ControllersService } from '@services/controllers.service';
import { ScannersService } from '@services/scanners.service';
import { EnforcersService } from '@services/enforcers.service';
import { NetworkRulesService } from '@services/network-rules.service';
import { DlpSensorsService } from '@services/dlp-sensors.service';
import { WafSensorsService } from '@services/waf-sensors.service';
import { DashboardService } from '@services/dashboard.service';
import { SignaturesService } from '@services/signatures.service';

import { DisplayControlDirective } from '@common/directives/displayControl.directive';
import { TimeagoModule } from 'ngx-timeago';
import { BytesPipe } from '@common/pipes/app.pipes';
import { ShortenFromMiddlePipe } from '@common/pipes/app.pipes';
import { CapitalizePipe } from '@common/pipes/app.pipes';
import { CapitalizeWordsPipe } from '@common/pipes/app.pipes';
import { ContainersService } from '@services/containers.service';
import { ScanService } from '@services/scan.service';
import { AssetsHttpService } from './api/assets-http.service';
import { AuthHttpService } from './api/auth-http.service';
import { ConfigHttpService } from './api/config-http.service';
import { RisksHttpService } from './api/risks-http.service';
import { NodesService } from '@services/nodes.service';
import { VersionInfoService } from '@services/version-info.service';
import { PlatformsService } from '@services/platforms.service';
import { EventsService } from '@services/events.service';
import { RiskReportsService } from '@services/risk-reports.service';
import { EventsHttpService } from './api/events-http.service';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { DashboardHttpService } from './api/dashboard-http.service';
import { PolicyHttpService } from './api/policy-http.service';
import { GraphHttpService } from './api/graph-http.service';
import { SecurityEventsService } from '@services/security-events.service';
import { TwoWayInfiniteScrollDirective } from './directives/two-way-infinite-scroll.directive';

import { EnforcerBriefModule } from '@components/enforcer-brief/enforcer-brief.module';
import { CommonHttpService } from './api/common-http.service';
import { SummaryService } from '@services/summary.service';
import { NamespacesService } from '@services/namespaces.service';
import { RemoteGridBindingDirective } from './directives/remote-grid-binding.directive';

// https://angular.io/styleguide#!#04-10
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AccordionModule.forRoot(),
    AlertModule.forRoot(),
    ButtonsModule.forRoot(),
    CarouselModule.forRoot(),
    CollapseModule.forRoot(),
    BsDatepickerModule.forRoot(),
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
    RatingModule.forRoot(),
    TabsModule.forRoot(),
    TimepickerModule.forRoot(),
    TooltipModule.forRoot(),
    PopoverModule.forRoot(),
    TypeaheadModule.forRoot(),
    ToastrModule.forRoot(),
    // Material Modules
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTableModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatSortModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatNativeDateModule,
    MatStepperModule,
    MatBadgeModule,
    EnforcerBriefModule,
    TimeagoModule.forRoot(), 
  ],
  providers: [
    PendingChangesGuard,
    ColorsService,
    UtilsService,
    AuthService,
    CookieService,
    AuthUtilsService,
    GroupsService,
    ProcessProfileRulesService,
    NotificationService,
    DatePipe,
    BytesPipe,
    CapitalizePipe,
    CapitalizeWordsPipe,
    ShortenFromMiddlePipe,
    FileAccessRulesService,
    ResponseRulesService,
    AdmissionRulesService,
    NetworkRulesService,
    ControllersService,
    ScannersService,
    EnforcersService,
    DlpSensorsService,
    WafSensorsService,
    ContainersService,
    NamespacesService,
    NodesService,
    PlatformsService,
    VersionInfoService,
    ScanService,
    EventsService,
    RiskReportsService,
    DashboardService,
    SummaryService,
    // Http Services
    AssetsHttpService,
    AuthHttpService,
    CommonHttpService,
    ConfigHttpService,
    DashboardHttpService,
    EventsHttpService,
    PolicyHttpService,
    RisksHttpService,
    SecurityEventsService,
    GraphHttpService,
    SignaturesService,
  ],
  declarations: [
    DisplayControlDirective,
    TwoWayInfiniteScrollDirective,
    RemoteGridBindingDirective,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    AccordionModule,
    AlertModule,
    ButtonsModule,
    CarouselModule,
    CollapseModule,
    BsDatepickerModule,
    BsDropdownModule,
    ModalModule,
    PaginationModule,
    ProgressbarModule,
    RatingModule,
    TabsModule,
    TimepickerModule,
    TooltipModule,
    PopoverModule,
    TypeaheadModule,
    ToastrModule,
    // Material Modules
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTableModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatSortModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatNativeDateModule,
    MatStepperModule,
    MatBadgeModule,
    DisplayControlDirective,
    RemoteGridBindingDirective,
    TwoWayInfiniteScrollDirective,
  ],
})

export class NvCommonModule {
  static forRoot(): ModuleWithProviders<NvCommonModule> {
    return {
      ngModule: NvCommonModule,
    };
  }
}
