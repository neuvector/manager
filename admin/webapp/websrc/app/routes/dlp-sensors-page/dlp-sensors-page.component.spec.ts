import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlpSensorsPageComponent } from './dlp-sensors-page.component';

describe('DlpSensorsPageComponent', () => {
  let component: DlpSensorsPageComponent;
  let fixture: ComponentFixture<DlpSensorsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DlpSensorsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DlpSensorsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
