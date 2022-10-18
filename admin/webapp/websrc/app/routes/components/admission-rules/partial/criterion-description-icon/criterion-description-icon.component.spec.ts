import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriterionDescriptionIconComponent } from './criterion-description-icon.component';

describe('CriterionDescriptionIconComponent', () => {
  let component: CriterionDescriptionIconComponent;
  let fixture: ComponentFixture<CriterionDescriptionIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CriterionDescriptionIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CriterionDescriptionIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
