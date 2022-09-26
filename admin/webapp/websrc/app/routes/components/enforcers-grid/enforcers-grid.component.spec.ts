import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnforcersGridComponent } from './enforcers-grid.component';

describe('EnforcersGridComponent', () => {
  let component: EnforcersGridComponent;
  let fixture: ComponentFixture<EnforcersGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnforcersGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnforcersGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
