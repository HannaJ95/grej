import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { PropertyKind } from '../../../core/product-property';
import { Button } from '../../../shared/button/button';
import { toPageNumber } from '../../../shared/page-number';
import { PROPERTY_TEXTS } from '../property-texts';

// The CMS's list of materials (/admin/material) or colors (/admin/farger), sorted by name.
// Built the same way as AdminCategoryList, but one component serves both lists.
@Component({
  selector: 'app-admin-property-list',
  imports: [RouterLink, TitleCasePipe, Button],
  templateUrl: './admin-property-list.html',
})
export class AdminPropertyList {
  private readonly properties = inject(AdminPropertyService);

  // Which list, from the route's data in app.routes.ts. withComponentInputBinding sets it,
  // the same way as :id and ?sida=.
  readonly kind = input.required<PropertyKind>();
  // The ?sida= in the URL, the same way as in AdminCategoryList.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);
  protected readonly result = this.properties.getProperties(this.kind, this.page);
}
