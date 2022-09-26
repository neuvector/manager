import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionRulesPageComponent } from './admission-rules-page.component';

describe('AdmissionRulesPageComponent', () => {
  let component: AdmissionRulesPageComponent;
  let fixture: ComponentFixture<AdmissionRulesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdmissionRulesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdmissionRulesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
