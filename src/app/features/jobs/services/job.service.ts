import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../enviroment/environment';

export interface JobOfferRow {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  tipoContrato: string;
  sueldoMin?: number;
  sueldoMax?: number;
  colonia?: string;
  codigoPostal?: string;
  calle?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  referencias?: string;
  contactoEmail?: string;
  contactoTel?: string;
  contactoWhatsapp?: string;
  status: string;
  fechaCierre: string;
  createdAt: string;
  company?: { nombre: string; colonia: string };
  companyId?: string;
  companyName?: string;
}

export interface BackendlessPage<T> {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/backendless/JobOffer`;

  list(params: { page?: number; limit?: number; search?: string[]; order?: string; q?: string }): Observable<BackendlessPage<JobOfferRow>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.q?.trim()) httpParams = httpParams.set('q', params.q.trim());
    if (params.search?.length) params.search.forEach(s => { if(s?.trim()) httpParams = httpParams.append('search', s.trim()); });
    if (params.order) httpParams = httpParams.set('order', params.order);
    return this.http.get<BackendlessPage<JobOfferRow>>(`${this.base}/quick`, { params: httpParams });
  }

  get(id: string): Observable<JobOfferRow> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(res => res.data?.[0] ?? res));
  }

  incrementView(id: string): Observable<any> {
    // public endpoint no requiere auth, backendless view también
    return this.http.post(`${environment.apiBaseUrl}/public/jobs/${id}/view`, {});
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  update(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
