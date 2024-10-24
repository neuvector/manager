import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformsGridComponent } from './platforms-grid.component';

describe('PlatformsGridComponent', () => {
  let component: PlatformsGridComponent;
  let fixture: ComponentFixture<PlatformsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlatformsGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
