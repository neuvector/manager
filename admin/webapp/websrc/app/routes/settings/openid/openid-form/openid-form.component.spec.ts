import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenidFormComponent } from './openid-form.component';

describe('OpenidFormComponent', () => {
  let component: OpenidFormComponent;
  let fixture: ComponentFixture<OpenidFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OpenidFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenidFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
