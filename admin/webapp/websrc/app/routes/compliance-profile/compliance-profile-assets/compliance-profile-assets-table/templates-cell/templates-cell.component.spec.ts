import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesCellComponent } from './templates-cell.component';

describe('TemplatesCellComponent', () => {
  let component: TemplatesCellComponent;
  let fixture: ComponentFixture<TemplatesCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemplatesCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
