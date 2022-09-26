import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseRulesPageComponent } from './response-rules-page.component';

describe('ResponseRulesPageComponent', () => {
  let component: ResponseRulesPageComponent;
  let fixture: ComponentFixture<ResponseRulesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponseRulesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseRulesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
