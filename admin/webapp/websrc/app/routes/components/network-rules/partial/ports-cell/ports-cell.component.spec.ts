import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortsCellComponent } from './ports-cell.component';

describe('PortsCellComponent', () => {
  let component: PortsCellComponent;
  let fixture: ComponentFixture<PortsCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortsCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PortsCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
