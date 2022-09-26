import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessProfileRulesComponent } from './process-profile-rules.component';

describe('ProcessProfileRulesComponent', () => {
  let component: ProcessProfileRulesComponent;
  let fixture: ComponentFixture<ProcessProfileRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessProfileRulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessProfileRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
