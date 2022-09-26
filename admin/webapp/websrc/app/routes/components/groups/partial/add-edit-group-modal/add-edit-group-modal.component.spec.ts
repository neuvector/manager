import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditGroupModalComponent } from './add-edit-group-modal.component';

describe('AddEditGroupModalComponent', () => {
  let component: AddEditGroupModalComponent;
  let fixture: ComponentFixture<AddEditGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditGroupModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
