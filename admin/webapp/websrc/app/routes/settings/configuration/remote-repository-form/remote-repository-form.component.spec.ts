import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteRepositoryFormComponent } from './remote-repository-form.component';

describe('RemoteRepositoryFormComponent', () => {
  let component: RemoteRepositoryFormComponent;
  let fixture: ComponentFixture<RemoteRepositoryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RemoteRepositoryFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteRepositoryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
