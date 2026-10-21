import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService, JobOfferRow } from '../../services/job.service';

@Component({
  standalone: true,
  selector: 'app-job-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-list.component.html',
})
export class JobListComponent implements OnInit {
  private readonly jobs = inject(JobService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  data: JobOfferRow[] = [];
  loading = false;
  q = '';
  categoria = '';
  colonia = '';
  tipoContrato = '';
  sueldoMin = '';
  page = 1;
  total = 0;
  limit = 9;

  ngOnInit(): void {
    // sync desde queryParams para links compartibles
    const qp = this.route.snapshot.queryParamMap;
    this.q = qp.get('q') || '';
    this.categoria = qp.get('categoria') || '';
    this.colonia = qp.get('colonia') || '';
    this.tipoContrato = qp.get('tipo') || '';
    this.sueldoMin = qp.get('sueldoMin') || '';
    this.page = parseInt(qp.get('page') || '1', 10) || 1;
    this.load(this.page, false);
  }

  load(page = 1, pushUrl = true): void {
    this.loading = true;
    this.page = page;
    this.cdr.detectChanges();
    if (pushUrl) {
      const qp: any = {};
      if (this.q.trim()) qp.q = this.q.trim();
      if (this.categoria.trim()) qp.categoria = this.categoria.trim();
      if (this.colonia.trim()) qp.colonia = this.colonia.trim();
      if (this.tipoContrato) qp.tipo = this.tipoContrato;
      if (this.sueldoMin) qp.sueldoMin = this.sueldoMin;
      if (page > 1) qp.page = page;
      this.router.navigate([], { relativeTo: this.route, queryParams: qp, replaceUrl: true });
    }
    const search: string[] = [];
    if (this.categoria.trim()) search.push(`categoria=${this.categoria.trim()}`);
    if (this.colonia.trim()) search.push(`colonia=${this.colonia.trim()}`);
    if (this.tipoContrato) search.push(`tipoContrato=${this.tipoContrato}`);
    if (this.sueldoMin && !isNaN(Number(this.sueldoMin))) search.push(`sueldoMin>=${Number(this.sueldoMin)}`);
    search.push(`status=PUBLICADA`);
    const q = this.q.trim() || undefined;
    this.jobs.list({ page, limit: this.limit, search, order: 'createdAt:desc', q }).subscribe({
      next: res => {
        this.data = res.data || [];
        this.total = res.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void { this.load(1); }

  clearFilters(): void {
    this.q = ''; this.categoria = ''; this.colonia = ''; this.tipoContrato = ''; this.sueldoMin = '';
    this.load(1);
  }
}
