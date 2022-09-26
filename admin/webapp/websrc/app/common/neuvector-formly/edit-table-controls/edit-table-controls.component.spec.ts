import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTableControlsComponent } from './edit-table-controls.component';

describe('EditTableControlsComponent', () => {
  let component: EditTableControlsComponent;
  let fixture: ComponentFixture<EditTableControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditTableControlsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTableControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
