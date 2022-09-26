import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionRulesComponent } from './admission-rules.component';

describe('AdmissionRulesComponent', () => {
  let component: AdmissionRulesComponent;
  let fixture: ComponentFixture<AdmissionRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdmissionRulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdmissionRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
