import { TestBed } from '@angular/core/testing';

import { VulnerabilitiesService } from './vulnerabilities.service';

describe('VulnerabilitiesService', () => {
  let service: VulnerabilitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VulnerabilitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
