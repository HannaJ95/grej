import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { isActive, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { AuthService } from '../../../core/auth.service';
import { Badge } from '../../../shared/badge/badge';
import { Icon } from '../../../shared/icons/icon';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ThemeToggle } from '../../../shared/theme-toggle/theme-toggle';

// AdminLayout shows it to the left on a computer and in a drawer on tablets and phones.
@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive, Badge, Icon, IconButton, ThemeToggle],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.scss',
})
export class AdminNav {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // The logged-in admin's email, from AdminLayout. Undefined if the token cannot be read.
  readonly email = input<string>();
  // True in the drawer, which has a close button.
  readonly inDrawer = input(false);
  readonly closeDrawer = output();

  // The categories the category pages have fetched. The menu never fetches them itself, so the
  // other admin pages send no extra request; until a category page is opened, no numbers show.
  private readonly categories = inject(AdminCategoryService).all;
  private readonly categoryItems = computed(() =>
    this.categories.hasValue() ? this.categories.value().items : undefined,
  );
  // The main categories, each with its number of subcategories, for the third level.
  protected readonly mainCategories = computed(() =>
    this.categoryItems()?.filter((c) => c.parentId === null),
  );
  protected readonly subcategoryCount = computed(
    () => this.categoryItems()?.filter((c) => c.parentId !== null).length,
  );

  protected readonly initial = computed(() => this.email()?.charAt(0).toUpperCase() ?? '');
  // The email in two parts, so the template can let it break after the @.
  protected readonly emailParts = computed(() => {
    const email = this.email() ?? '';
    const at = email.lastIndexOf('@');
    return at < 0 ? undefined : { local: email.slice(0, at), domain: email.slice(at + 1) };
  });

  // Also true on /admin/kategorier/3.
  private readonly onMainCategoryPage = isActive('/admin/kategorier', this.router);
  // Also /admin/underkategorier/3, which then shows the main categories under Underkategorier.
  protected readonly onSubcategoryPage = isActive('/admin/underkategorier', this.router);
  private readonly onMaterialPage = isActive('/admin/material', this.router);
  private readonly onColorPage = isActive('/admin/farger', this.router);

  // A group is open while one of its pages is shown. The admin can fold it until the next page
  // opens it again.
  protected readonly categoriesOpen = linkedSignal(
    () => this.onMainCategoryPage() || this.onSubcategoryPage(),
  );
  protected readonly propertiesOpen = linkedSignal(
    () => this.onMaterialPage() || this.onColorPage(),
  );

  protected async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/admin/logga-in');
  }
}
