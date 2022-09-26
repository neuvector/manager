import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerDetailsComponent } from './scanner-details.component';

describe('ScannerDetailsComponent', () => {
  let component: ScannerDetailsComponent;
  let fixture: ComponentFixture<ScannerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScannerDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScannerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
