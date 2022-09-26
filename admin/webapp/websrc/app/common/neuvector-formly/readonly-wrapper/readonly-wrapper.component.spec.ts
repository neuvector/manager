import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadonlyWrapperComponent } from './readonly-wrapper.component';

describe('ReadonlyWrapperComponent', () => {
  let component: ReadonlyWrapperComponent;
  let fixture: ComponentFixture<ReadonlyWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReadonlyWrapperComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadonlyWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
