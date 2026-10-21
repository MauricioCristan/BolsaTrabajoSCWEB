import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobService, JobOfferRow } from '../../services/job.service';

@Component({
  standalone: true,
  selector: 'app-job-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jobs = inject(JobService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  job: JobOfferRow | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.jobs.get(id).subscribe({
      next: j => {
        this.job = j;
        this.loading = false;
        this.title.setTitle(`${j.titulo} - Bolsa Santa Catarina`);
        const desc = j.descripcion?.slice(0, 160) || 'Vacante en Santa Catarina';
        this.meta.updateTag({ name: 'description', content: desc });
        this.meta.updateTag({ property: 'og:title', content: `${j.titulo} - Bolsa Santa Catarina` });
        this.meta.updateTag({ property: 'og:description', content: desc });
        this.injectJsonLd(j);
        this.cdr.detectChanges();
        // incrementa views en background (no bloquea UI)
        this.jobs.incrementView(id).subscribe({ error: () => {} });
      },
      error: err => {
        this.error = err?.error?.message || 'No se encontró la vacante';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private injectJsonLd(j: JobOfferRow): void {
    const existing = this.document.getElementById('json-ld-job');
    if (existing) existing.remove();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'json-ld-job';
    const data: any = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: j.titulo,
      description: j.descripcion,
      datePosted: j.createdAt,
      validThrough: j.fechaCierre,
      employmentType: j.tipoContrato,
      hiringOrganization: { '@type': 'Organization', name: j.company?.nombre || 'Empresa verificada - Santa Catarina', address: this.direccionCompleta },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: `${j.calle || ''} ${j.numeroExterior || ''}`, addressLocality: 'Santa Catarina', addressRegion: 'Nuevo León', postalCode: j.codigoPostal || '', addressCountry: 'MX' } },
    };
    // escapa </script para evitar XSS almacenado (OWASP)
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }

  get direccionCompleta(): string {
    if (!this.job) return '';
    const partes: string[] = [];
    if (this.job.calle) {
      let dir = `${this.job.calle} ${this.job.numeroExterior || 'S/N'}`;
      if (this.job.numeroInterior) dir += ` Int. ${this.job.numeroInterior}`;
      partes.push(dir);
    }
    if (this.job.colonia) partes.push(`Col. ${this.job.colonia}`);
    if (this.job.codigoPostal) partes.push(`C.P. ${this.job.codigoPostal}`);
    partes.push('Santa Catarina, N.L.');
    return partes.join(', ');
  }

  get mapsUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.direccionCompleta)}`;
  }

  get mapsEmbedUrl(): SafeResourceUrl {
    const q = encodeURIComponent(this.direccionCompleta);
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${q}&z=15&output=embed`);
  }

  get mailto(): string {
    if (!this.job?.contactoEmail) return '';
    return `mailto:${this.job.contactoEmail}?subject=Postulación - ${encodeURIComponent(this.job.titulo)}&body=Hola, me interesa la vacante ${this.job.titulo} publicada en Bolsa Santa Catarina.`;
  }

  get whatsapp(): string {
    if (!this.job?.contactoWhatsapp) return '';
    const num = this.job.contactoWhatsapp.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hola, me interesa la vacante "${this.job.titulo}" publicada en Bolsa Santa Catarina.`);
    return `https://wa.me/52${num}?text=${text}`;
  }

  get tel(): string {
    if (!this.job?.contactoTel) return '';
    return `tel:${this.job.contactoTel}`;
  }
}
