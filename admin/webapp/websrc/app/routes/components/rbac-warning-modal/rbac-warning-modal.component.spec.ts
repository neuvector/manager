import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RbacWarningModalComponent } from './rbac-warning-modal.component';

describe('RbacWarningModalComponent', () => {
  let component: RbacWarningModalComponent;
  let fixture: ComponentFixture<RbacWarningModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RbacWarningModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RbacWarningModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
