import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApikeysGridComponent } from './apikeys-grid.component';

describe('ApikeysGridComponent', () => {
  let component: ApikeysGridComponent;
  let fixture: ComponentFixture<ApikeysGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApikeysGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApikeysGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
