import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformDetailsComponent } from './platform-details.component';

describe('PlatformDetailsComponent', () => {
  let component: PlatformDetailsComponent;
  let fixture: ComponentFixture<PlatformDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlatformDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
