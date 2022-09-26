import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersGridUsernameCellComponent } from './users-grid-username-cell.component';

describe('UsersGridUsernameCellComponent', () => {
  let component: UsersGridUsernameCellComponent;
  let fixture: ComponentFixture<UsersGridUsernameCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersGridUsernameCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersGridUsernameCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
