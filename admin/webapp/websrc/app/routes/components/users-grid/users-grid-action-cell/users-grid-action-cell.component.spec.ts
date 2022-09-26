import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersGridActionCellComponent } from './users-grid-action-cell.component';

describe('UsersGridActionCellComponent', () => {
  let component: UsersGridActionCellComponent;
  let fixture: ComponentFixture<UsersGridActionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersGridActionCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersGridActionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
