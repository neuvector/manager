import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodBriefComponent } from './pod-brief.component';

describe('PodBriefComponent', () => {
  let component: PodBriefComponent;
  let fixture: ComponentFixture<PodBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodBriefComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
