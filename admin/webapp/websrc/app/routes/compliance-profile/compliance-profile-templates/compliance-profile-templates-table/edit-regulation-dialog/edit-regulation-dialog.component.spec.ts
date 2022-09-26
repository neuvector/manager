import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRegulationDialogComponent } from './edit-regulation-dialog.component';

describe('EditRegulationDialogComponent', () => {
  let component: EditRegulationDialogComponent;
  let fixture: ComponentFixture<EditRegulationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditRegulationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRegulationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
