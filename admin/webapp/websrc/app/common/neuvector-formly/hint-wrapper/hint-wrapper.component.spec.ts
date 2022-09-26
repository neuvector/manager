import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HintWrapperComponent } from './hint-wrapper.component';

describe('HintWrapperComponent', () => {
  let component: HintWrapperComponent;
  let fixture: ComponentFixture<HintWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HintWrapperComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HintWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
