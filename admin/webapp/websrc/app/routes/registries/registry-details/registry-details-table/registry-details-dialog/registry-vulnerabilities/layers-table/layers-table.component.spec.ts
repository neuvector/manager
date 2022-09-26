import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersTableComponent } from './layers-table.component';

describe('ImageTableComponent', () => {
  let component: LayersTableComponent;
  let fixture: ComponentFixture<LayersTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayersTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
