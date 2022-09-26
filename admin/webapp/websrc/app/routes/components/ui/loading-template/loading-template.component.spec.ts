import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingTemplateComponent } from './loading-template.component';

describe('LoadingTemplateComponent', () => {
  let component: LoadingTemplateComponent;
  let fixture: ComponentFixture<LoadingTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoadingTemplateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
