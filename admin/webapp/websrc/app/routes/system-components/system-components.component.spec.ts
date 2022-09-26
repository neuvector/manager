import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemComponentsComponent } from './system-components.component';

describe('SystemComponentsComponent', () => {
  let component: SystemComponentsComponent;
  let fixture: ComponentFixture<SystemComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemComponentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
