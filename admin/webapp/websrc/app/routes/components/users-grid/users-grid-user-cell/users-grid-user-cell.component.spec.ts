import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersGridUserCellComponent } from './users-grid-user-cell.component';

describe('UsersGridUserCellComponent', () => {
  let component: UsersGridUserCellComponent;
  let fixture: ComponentFixture<UsersGridUserCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersGridUserCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersGridUserCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
