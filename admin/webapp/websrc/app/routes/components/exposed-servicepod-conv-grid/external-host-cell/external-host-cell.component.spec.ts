import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalHostCellComponent } from './external-host-cell.component';

describe('ExternalHostCellComponent', () => {
  let component: ExternalHostCellComponent;
  let fixture: ComponentFixture<ExternalHostCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalHostCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExternalHostCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
