import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespacesGridComponent } from './namespaces-grid.component';

describe('NamespacesGridComponent', () => {
  let component: NamespacesGridComponent;
  let fixture: ComponentFixture<NamespacesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespacesGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespacesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
