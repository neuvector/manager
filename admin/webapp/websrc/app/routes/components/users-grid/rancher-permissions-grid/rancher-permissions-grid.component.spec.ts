import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RancherPermissionsGridComponent } from './rancher-permissions-grid.component';

describe('RancherPermissionsGridComponent', () => {
  let component: RancherPermissionsGridComponent;
  let fixture: ComponentFixture<RancherPermissionsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RancherPermissionsGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RancherPermissionsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
