import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespacesComponent } from './namespaces.component';

describe('NamespacesComponent', () => {
  let component: NamespacesComponent;
  let fixture: ComponentFixture<NamespacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespacesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
