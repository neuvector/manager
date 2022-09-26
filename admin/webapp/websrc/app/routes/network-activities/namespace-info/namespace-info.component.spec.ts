import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespaceInfoComponent } from './namespace-info.component';

describe('NamespaceInfoComponent', () => {
  let component: NamespaceInfoComponent;
  let fixture: ComponentFixture<NamespaceInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespaceInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespaceInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
