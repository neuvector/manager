import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiClusterComponent } from './multi-cluster.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import * as axe from 'axe-core';

describe('MultiClusterComponent', () => {
  let component: MultiClusterComponent;
  let fixture: ComponentFixture<MultiClusterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiClusterComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass accessibility test', done => {
    axe.run(fixture.nativeElement, (err, result) => {
      expect(result.violations.length).toBe(0);
      done();
    });
  });
});
