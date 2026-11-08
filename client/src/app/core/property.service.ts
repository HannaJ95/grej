import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { PropertyKind, ShopProperty } from './product-property';

// The shop's materials and colors from the API's open endpoints. The CMS uses
// AdminPropertyService.
@Service()
export class PropertyService {
  // Sorted by name. Must be called in a field, like CategoryService.getCategories.
  getProperties(kind: PropertyKind) {
    return httpResource<ShopProperty[]>(() => `${environment.apiUrl}/api/${kind}`);
  }
}
