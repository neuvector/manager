import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesCellComponent } from './categories-cell.component';

describe('CategoriesCellComponent', () => {
  let component: CategoriesCellComponent;
  let fixture: ComponentFixture<CategoriesCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CategoriesCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoriesCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
