import { Component, computed, inject, Resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { AdminOrderService } from '../../../core/admin-order.service';
import { AdminProductService } from '../../../core/admin-product.service';
import { Icon } from '../../../shared/icons/icon';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';

type Count = number | 'loading' | 'error';

interface OverviewCard {
  id: string;
  title: string;
  count: Count;
  one: string;
  many: string;
  link: string;
  linkText: string;
}

// /admin: the numbers from the lists the API already has, with a link to each list.
@Component({
  selector: 'app-admin-home',
  imports: [RouterLink, Icon, AdminPageHeader],
  templateUrl: './admin-home.html',
  styleUrls: ['../admin-page.scss', './admin-home.scss'],
})
export class AdminHome {
  // Only the first page is fetched; totalCount counts them all.
  private readonly toDo = inject(AdminOrderService).getOrders(signal(1), signal(false));
  private readonly products = inject(AdminProductService).getProducts(signal(1));
  // The same request as the menu's numbers, so they show up in the menu too.
  private readonly categories = inject(AdminCategoryService).loadAll();

  protected readonly cards = computed<OverviewCard[]>(() => [
    {
      id: 'to-do',
      title: 'Att göra',
      count: countOf(this.toDo, (page) => page.totalCount),
      one: 'beställning väntar på dig',
      many: 'beställningar väntar på dig',
      link: '/admin/ordrar',
      linkText: 'Visa beställningar',
    },
    {
      id: 'products',
      title: 'Produkter',
      count: countOf(this.products, (page) => page.totalCount),
      one: 'produkt, även dolda',
      many: 'produkter, även dolda',
      link: '/admin/produkter',
      linkText: 'Visa produkter',
    },
    {
      id: 'categories',
      title: 'Kategorier',
      count: countOf(this.categories, (page) => page.items.filter((c) => !c.parentId).length),
      one: 'huvudkategori',
      many: 'huvudkategorier',
      link: '/admin/kategorier',
      linkText: 'Visa kategorier',
    },
  ]);
}

function countOf<T>(resource: Resource<T | undefined>, count: (value: T) => number): Count {
  if (resource.hasValue()) {
    return count(resource.value());
  }
  return resource.error() ? 'error' : 'loading';
}
