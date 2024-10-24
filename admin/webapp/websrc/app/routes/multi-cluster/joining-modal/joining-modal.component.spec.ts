import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoiningModalComponent } from './joining-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AgGridModule } from 'ag-grid-angular';
import { UtilsService } from '@common/utils/app.utils';
import { MultiClusterService } from '@services/multi-cluster.service';
import { SettingsService } from '@services/settings.service';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('JoiningModalComponent', () => {
  let component: JoiningModalComponent;
  let fixture: ComponentFixture<JoiningModalComponent>;
  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [JoiningModalComponent],
      providers: [
        MultiClusterService,
        SettingsService,
        UtilsService,
        MatDialog,
        {
          provide: MatDialogRef,
          useValue: mockDialogRef,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
      ],
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule.withRoutes([]),
        // AgGridModule.withComponents([])
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoiningModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
