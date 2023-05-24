import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddApikeyDialogComponent } from './add-apikey-dialog.component';

describe('AddApikeyDialogComponent', () => {
  let component: AddApikeyDialogComponent;
  let fixture: ComponentFixture<AddApikeyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddApikeyDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApikeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
