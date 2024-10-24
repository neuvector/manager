import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnforcerBriefComponent } from './enforcer-brief.component';

describe('EnforcerBriefComponent', () => {
  let component: EnforcerBriefComponent;
  let fixture: ComponentFixture<EnforcerBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnforcerBriefComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnforcerBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
