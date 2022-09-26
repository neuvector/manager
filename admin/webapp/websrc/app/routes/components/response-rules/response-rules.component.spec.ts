import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseRulesComponent } from './response-rules.component';

describe('ResponseRulesComponent', () => {
  let component: ResponseRulesComponent;
  let fixture: ComponentFixture<ResponseRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResponseRulesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
