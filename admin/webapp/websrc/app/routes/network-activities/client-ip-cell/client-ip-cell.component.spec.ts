import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientIpCellComponent } from './client-ip-cell.component';

describe('ClientIpCellComponent', () => {
  let component: ClientIpCellComponent;
  let fixture: ComponentFixture<ClientIpCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientIpCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientIpCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
