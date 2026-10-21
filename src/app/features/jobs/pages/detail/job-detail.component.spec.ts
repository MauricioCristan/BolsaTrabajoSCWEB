import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDetailComponent } from './job-detail.component';
import { JobService } from '../../services/job.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('JobDetailComponent', () => {
  let fixture: ComponentFixture<JobDetailComponent>;
  let component: JobDetailComponent;
  let mockJobs: any;

  const mockJob = {
    id: 'uuid-1',
    titulo: 'Operador de producción',
    descripcion: 'Desc',
    categoria: 'Industria',
    tipoContrato: 'TIEMPO_COMPLETO',
    calle: 'Av México',
    numeroExterior: '120',
    numeroInterior: null,
    colonia: 'Centro',
    codigoPostal: '66350',
    contactoEmail: 'rh@test.com',
    contactoTel: '8112345678',
    contactoWhatsapp: '8112345678',
    status: 'PUBLICADA',
    fechaCierre: '2099-12-31',
  };

  beforeEach(async () => {
    mockJobs = {
      get: vi.fn().mockReturnValue(of(mockJob)),
      incrementView: vi.fn().mockReturnValue(of({ success: true })),
    };
    await TestBed.configureTestingModule({
      imports: [JobDetailComponent],
      providers: [
        { provide: JobService, useValue: mockJobs },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'uuid-1' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(JobDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load job', () => {
    expect(component).toBeTruthy();
    expect(mockJobs.get).toHaveBeenCalledWith('uuid-1');
    expect(component.job).toBeTruthy();
    expect(component.job?.titulo).toBe('Operador de producción');
  });

  it('direccionCompleta concatena correctamente', () => {
    expect(component.direccionCompleta).toContain('Av México 120');
    expect(component.direccionCompleta).toContain('Col. Centro');
    expect(component.direccionCompleta).toContain('C.P. 66350');
    expect(component.direccionCompleta).toContain('Santa Catarina');
  });

  it('direccionCompleta con interior', () => {
    component.job = { ...mockJob, numeroInterior: '4' } as any;
    expect(component.direccionCompleta).toContain('Int. 4');
  });

  it('mapsUrl encodea direccion', () => {
    const url = component.mapsUrl;
    expect(url).toContain('https://www.google.com/maps/search/');
    expect(url).toContain(encodeURIComponent(component.direccionCompleta));
  });

  it('mailto genera subject y body', () => {
    expect(component.mailto).toContain('mailto:rh@test.com');
    expect(component.mailto).toContain(encodeURIComponent(mockJob.titulo));
  });

  it('whatsapp normaliza numero y añade texto', () => {
    const wa = component.whatsapp;
    expect(wa).toContain('https://wa.me/52');
    expect(wa).toContain(encodeURIComponent('Hola, me interesa la vacante'));
  });

  it('tel genera tel:', () => {
    expect(component.tel).toBe('tel:8112345678');
  });

  it('incrementa views al cargar', () => {
    expect(mockJobs.incrementView).toHaveBeenCalledWith('uuid-1');
  });
});
