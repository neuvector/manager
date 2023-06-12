import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFooterComponent } from './custom-footer.component';

describe('CustomFooterComponent', () => {
  let component: CustomFooterComponent;
  let fixture: ComponentFixture<CustomFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomFooterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
