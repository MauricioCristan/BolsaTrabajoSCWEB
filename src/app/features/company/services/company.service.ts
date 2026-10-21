import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../enviroment/environment';
import { BackendlessPage } from '../../jobs/services/job.service';

export interface RegisterCompanyPayload {
  username: string; password: string; email?: string; nombre: string;
  rfc: string; colonia: string; telefono?: string; descripcion?: string;
}

export interface CompanyRow {
  id: string; nombre: string; colonia: string; verificada: boolean;
  rfc?: string; telefono?: string; descripcion?: string; rejectionReason?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/backendless/Company`;

  register(payload: RegisterCompanyPayload) { return this.http.post<any>(`${environment.apiBaseUrl}/auth/register-company`, payload); }
  myCompany() { return this.http.get<any>(`${this.base}/quick?limit=1`); }
  updateCompany(id: string, payload: any) { return this.http.put<any>(`${this.base}/${id}`, payload); }

  list(page = 1, q = '', verified = '') {
    let params = new HttpParams().set('page', page).set('limit', 20).set('order', 'nombre:asc');
    if (q.trim()) params = params.set('q', q.trim());
    if (verified) params = params.append('search', `verificada=${verified}`);
    return this.http.get<BackendlessPage<CompanyRow>>(`${this.base}/quick`, { params });
  }

  update(id: string, body: Partial<CompanyRow>) { return this.http.put(`${this.base}/${id}`, body); }
}
