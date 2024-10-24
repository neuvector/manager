import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternActionButtonsComponent } from './pattern-action-buttons.component';

describe('PatternActionButtonsComponent', () => {
  let component: PatternActionButtonsComponent;
  let fixture: ComponentFixture<PatternActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatternActionButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
