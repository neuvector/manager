import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerBriefComponent } from './container-brief.component';

describe('ContainerBriefComponent', () => {
  let component: ContainerBriefComponent;
  let fixture: ComponentFixture<ContainerBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContainerBriefComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
