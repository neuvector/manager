import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainNameCellComponent } from './domain-name-cell.component';

describe('DomainNameCellComponent', () => {
  let component: DomainNameCellComponent;
  let fixture: ComponentFixture<DomainNameCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DomainNameCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainNameCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
