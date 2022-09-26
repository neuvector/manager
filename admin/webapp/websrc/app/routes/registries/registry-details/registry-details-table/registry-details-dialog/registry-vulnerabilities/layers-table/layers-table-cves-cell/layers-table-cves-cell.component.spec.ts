import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersTableCvesCellComponent } from './layers-table-cves-cell.component';

describe('LayersTableCvesCellComponent', () => {
  let component: LayersTableCvesCellComponent;
  let fixture: ComponentFixture<LayersTableCvesCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayersTableCvesCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersTableCvesCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
