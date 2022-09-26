import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustableDivComponent } from './adjustable-div.component';

describe('AdjustableDivComponent', () => {
  let component: AdjustableDivComponent;
  let fixture: ComponentFixture<AdjustableDivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdjustableDivComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdjustableDivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
