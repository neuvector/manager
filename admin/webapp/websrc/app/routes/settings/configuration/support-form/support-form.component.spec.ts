import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportFormComponent } from './support-form.component';

describe('SupportFormComponent', () => {
  let component: SupportFormComponent;
  let fixture: ComponentFixture<SupportFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupportFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
