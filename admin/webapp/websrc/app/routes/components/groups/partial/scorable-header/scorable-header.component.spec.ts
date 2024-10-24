import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScorableHeaderComponent } from './scorable-header.component';

describe('ScorableHeaderComponent', () => {
  let component: ScorableHeaderComponent;
  let fixture: ComponentFixture<ScorableHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScorableHeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScorableHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
