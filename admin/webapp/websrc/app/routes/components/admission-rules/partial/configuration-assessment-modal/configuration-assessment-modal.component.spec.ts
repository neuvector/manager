import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationAssessmentModalComponent } from './configuration-assessment-modal.component';

describe('ConfigurationAssessmentModalComponent', () => {
  let component: ConfigurationAssessmentModalComponent;
  let fixture: ComponentFixture<ConfigurationAssessmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationAssessmentModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurationAssessmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
