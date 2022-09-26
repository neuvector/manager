import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesGridComponent } from './roles-grid.component';

describe('RolesGridComponent', () => {
  let component: RolesGridComponent;
  let fixture: ComponentFixture<RolesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RolesGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RolesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
