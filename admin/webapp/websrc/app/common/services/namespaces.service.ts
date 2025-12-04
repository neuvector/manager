import { Injectable } from '@angular/core';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { Domain } from '@common/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface DomainsResponse {
  domains: Domain[];
}

@Injectable()
export class NamespacesService {
  private _domains: Domain[] = [];
  get namespaces() {
    return this._domains;
  }
  set namespaces(domains: Domain[]) {
    this._domains = domains;
  }

  constructor(private assetsHttpService: AssetsHttpService) {}

  resetNamespaces(): void {
    this.namespaces = [];
  }

  getNamespaces(): Observable<Domain[]> {
    return this.assetsHttpService.getDomain().pipe(
      map((r: DomainsResponse) => r.domains.filter(d => d.name.charAt(0) !== '_'))
    );
  }
}
