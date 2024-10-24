import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortsFullListModalComponent } from './ports-full-list-modal.component';

describe('PortsFullListModalComponent', () => {
  let component: PortsFullListModalComponent;
  let fixture: ComponentFixture<PortsFullListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortsFullListModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PortsFullListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
