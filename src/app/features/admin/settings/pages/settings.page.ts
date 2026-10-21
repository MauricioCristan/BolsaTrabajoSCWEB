import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { SettingDTO } from '../models/setting.model';
import { SettingsService } from '../services/settings.service';
import { I18nPipe } from '../../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { ADMIN_ROUTES } from '../../admin-routes';

type SettingInputType = 'boolean' | 'number' | 'text';

interface SettingView extends SettingDTO {
  inputType: SettingInputType;
  section: 'section.general' | 'section.email' | 'section.frontend' | 'section.security';
}

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule, FormsModule, I18nPipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(PermissionService);

  loading = false;
  saving = false;
  backendError: string | null = null;
  successMessage: string | null = null;
  canReadSettings = false;
  canUpdateSettings = false;

  rows: SettingView[] = [];
  groupedRows: Array<{ section: SettingView['section']; rows: SettingView[] }> = [];

  draftValues: Record<string, string> = {};
  private readonly initialValues = new Map<string, string>();
  private readonly changedKeys = new Set<string>();

  ngOnInit(): void {
    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.canReadSettings = this.permissions.canRead('SETTING');
        this.canUpdateSettings = this.permissions.canUpdate('SETTING');

        if (!this.canReadSettings) {
          this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
          return;
        }

        this.load();
      },
      error: () => {
        this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
      },
    });
  }

  load(): void {
    this.loading = true;
    this.backendError = null;
    this.successMessage = null;
    this.cdr.detectChanges();

    this.settingsService
      .list()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (settings) => {
          const sorted = settings.filter(item => !/cuadr|asistencia/i.test(`${item.key} ${item.description || ''}`)).sort((a, b) => a.key.localeCompare(b.key));

          this.rows = sorted.map((item) => ({
            ...item,
            inputType: this.resolveInputType(item.value),
            section: this.resolveSection(item.key),
          }));

          this.groupedRows = this.groupBySection(this.rows);

          this.draftValues = {};
          this.initialValues.clear();
          this.changedKeys.clear();

          this.rows.forEach((item) => {
            this.draftValues[item.key] = item.value ?? '';
            this.initialValues.set(item.key, item.value ?? '');
          });

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError = err?.error?.message ?? this.i18n.translate('settings', 'errorLoad');
          this.cdr.detectChanges();
        },
      });
  }

  onValueChange(key: string, value: string): void {
    if (!this.canUpdateSettings) return;
    this.draftValues[key] = value ?? '';
    this.recomputeDirtyState(key);
  }

  onBooleanChange(key: string, checked: boolean): void {
    if (!this.canUpdateSettings) return;
    this.draftValues[key] = checked ? 'true' : 'false';
    this.recomputeDirtyState(key);
  }

  isBooleanTrue(value: string | undefined): boolean {
    return (value ?? '').toLowerCase() === 'true';
  }

  isRowDirty(key: string): boolean {
    return this.changedKeys.has(key);
  }

  save(): void {
    if (!this.canUpdateSettings) return;
    if (!this.hasChanges || this.saving) return;

    this.saving = true;
    this.backendError = null;
    this.successMessage = null;
    this.cdr.detectChanges();

    const values: Record<string, string> = {};

    this.rows.forEach((row) => {
      if (!row.editable) return;
      if (!this.changedKeys.has(row.key)) return;
      values[row.key] = this.draftValues[row.key] ?? '';
    });

    const changesCount = Object.keys(values).length;
    if (changesCount === 0) {
      this.saving = false;
      this.cdr.detectChanges();
      return;
    }

    this.settingsService
      .update(values)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          Object.entries(values).forEach(([key, value]) => {
            this.initialValues.set(key, value);
            this.changedKeys.delete(key);
          });

          this.successMessage =
            changesCount === 1
              ? this.i18n.translate('settings', 'successOne', { count: changesCount })
              : this.i18n.translate('settings', 'successMany', { count: changesCount });
          this.notifications.success({ key: 'notifications.settings.updated' });

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError = err?.error?.message ?? this.i18n.translate('settings', 'errorSave');
          this.notifications.error(
            err?.error?.message || { key: 'notifications.settings.updateError' },
            {
              details: err?.error?.errors instanceof Array ? err.error.errors : undefined,
            }
          );
          this.cdr.detectChanges();
        },
      });
  }

  resetChanges(): void {
    if (!this.canUpdateSettings) return;
    this.rows.forEach((row) => {
      this.draftValues[row.key] = this.initialValues.get(row.key) ?? '';
    });

    this.changedKeys.clear();
    this.successMessage = null;
    this.backendError = null;
    this.cdr.detectChanges();
  }

  get dirtyCount(): number {
    return this.changedKeys.size;
  }

  get hasChanges(): boolean {
    return this.dirtyCount > 0;
  }

  trackByKey(_: number, item: SettingView): string {
    return item.key;
  }

  private recomputeDirtyState(key: string): void {
    const initial = this.initialValues.get(key) ?? '';
    const current = this.draftValues[key] ?? '';

    if (initial === current) {
      this.changedKeys.delete(key);
    } else {
      this.changedKeys.add(key);
    }

    this.successMessage = null;
    this.cdr.detectChanges();
  }

  private resolveSection(key: string): SettingView['section'] {
    if (key.startsWith('email.')) return 'section.email';
    if (key.startsWith('frontend.')) return 'section.frontend';
    if (key.startsWith('security.')) return 'section.security';
    return 'section.general';
  }

  private resolveInputType(value: string | null | undefined): SettingInputType {
    const normalized = (value ?? '').trim().toLowerCase();

    if (normalized === 'true' || normalized === 'false') {
      return 'boolean';
    }

    if (/^-?\d+$/.test(normalized)) {
      return 'number';
    }

    return 'text';
  }

  private groupBySection(rows: SettingView[]): Array<{ section: SettingView['section']; rows: SettingView[] }> {
    const sectionOrder: SettingView['section'][] = [
      'section.general',
      'section.email',
      'section.frontend',
      'section.security',
    ];
    const map = new Map<SettingView['section'], SettingView[]>();

    rows.forEach((row) => {
      if (!map.has(row.section)) {
        map.set(row.section, []);
      }
      map.get(row.section)?.push(row);
    });

    return [...map.entries()]
      .sort((a, b) => sectionOrder.indexOf(a[0]) - sectionOrder.indexOf(b[0]))
      .map(([section, sectionRows]) => ({ section, rows: sectionRows }));
  }
}

