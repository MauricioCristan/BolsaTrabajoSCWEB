import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SupportedLang } from '../../../core/i18n/i18n.registry';
import { ADMIN_ROUTES } from '../admin-routes';
import { PermissionService } from '../../../core/auth/permission.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, I18nPipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  readonly i18n = inject(I18nService);
  readonly ADMIN_ROUTES = ADMIN_ROUTES;
  readonly currentUsername = computed(() => this.permissions.me()?.username ?? '');

  loggingOut = false;

  // Desktop collapse (md+)
  sidebarCollapsed = false;

  ngOnInit(): void {
    this.permissions.ensureLoaded().subscribe({
      error: async () => {
        this.auth.logoutLocal();
        await this.router.navigate(['/login']);
      },
    });
  }

  canReadUsers(): boolean {
    return this.permissions.canRead('USER');
  }

  canReadRoles(): boolean {
    return this.permissions.canRead('ROLE');
  }

  canReadSettings(): boolean {
    return this.permissions.canRead('SETTING');
  }

  canModerate(): boolean {
    return this.permissions.hasAnyAdminRole();
  }

  isEmpresa(): boolean {
    return this.permissions.hasAuthority('ROLE_EMPRESA');
  }

  setLanguage(lang: SupportedLang): void {
    this.i18n.setLanguage(lang);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.loggingOut = true;

    this.auth.logout().subscribe({
      next: async () => {
        this.loggingOut = false;
        await this.router.navigate(['/login']);
      },
      error: async () => {
        this.auth.logoutLocal();
        this.loggingOut = false;
        await this.router.navigate(['/login']);
      },
    });
  }
}
