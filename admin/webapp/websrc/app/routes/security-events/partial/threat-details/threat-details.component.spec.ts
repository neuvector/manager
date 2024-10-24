import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatDetailsComponent } from './threat-details.component';

describe('ThreatDetailsComponent', () => {
  let component: ThreatDetailsComponent;
  let fixture: ComponentFixture<ThreatDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThreatDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
