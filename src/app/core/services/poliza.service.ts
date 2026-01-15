import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Poliza, CreatePolizaRequest } from '../models/seguros.models';
import { CacheService } from './cache.service';
import { CacheStrategy } from '../models/cache.models';
import { PolizaEventsService } from './poliza-events.service';

@Injectable({
  providedIn: 'root'
})
export class PolizaService {
  private apiUrl = `${environment.segurosApiUrl}/Polizas`;
  private cacheService = inject(CacheService);
  private polizaEventsService = inject(PolizaEventsService);

  constructor(private http: HttpClient) {}

  // Obtener todas las pólizas vigentes (ruta por defecto)
  getAll(): Observable<ApiResponse<Poliza[]>> {
    return this.http.get<ApiResponse<Poliza[]>>(`${this.apiUrl}/vigentes`);
  }

  getById(id: number): Observable<ApiResponse<Poliza>> {
    return this.http.get<ApiResponse<Poliza>>(`${this.apiUrl}/${id}`);
  }

  getByClienteId(clienteId: number): Observable<ApiResponse<Poliza[]>> {
    return this.http.get<ApiResponse<Poliza[]>>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  getByTipo(tipo: number): Observable<ApiResponse<Poliza[]>> {
    return this.http.get<ApiResponse<Poliza[]>>(`${this.apiUrl}/tipo/${tipo}`);
  }

  getByEstatus(estatus: number): Observable<ApiResponse<Poliza[]>> {
    return this.http.get<ApiResponse<Poliza[]>>(`${this.apiUrl}/estatus/${estatus}`);
  }

  getVigentes(): Observable<ApiResponse<Poliza[]>> {
    return this.http.get<ApiResponse<Poliza[]>>(`${this.apiUrl}/vigentes`);
  }

  create(poliza: CreatePolizaRequest): Observable<ApiResponse<Poliza>> {
    return this.http.post<ApiResponse<Poliza>>(`${this.apiUrl}`, poliza).pipe(
      tap(() => {
        this.invalidatePolizasCache();
        this.polizaEventsService.notifyPolizaChanged();
      })
    );
  }

  update(id: number, poliza: Partial<CreatePolizaRequest>): Observable<ApiResponse<Poliza>> {
    return this.http.put<ApiResponse<Poliza>>(`${this.apiUrl}/${id}`, poliza).pipe(
      tap(() => {
        this.invalidatePolizasCache();
        this.polizaEventsService.notifyPolizaChanged();
      })
    );
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.invalidatePolizasCache();
        this.polizaEventsService.notifyPolizaChanged();
      })
    );
  }

  cancelar(id: number): Observable<ApiResponse<Poliza>> {
    const url = `${this.apiUrl}/${id}/cancelar`;
    console.log('=== PolizaService.cancelar ===');
    console.log('URL completa:', url);
    console.log('Método HTTP: POST');
    console.log('Poliza ID:', id);
    console.log('Token:', localStorage.getItem('token') ? 'Presente' : 'No presente');
    console.log('==============================');
    // El endpoint /api/Polizas/{id}/cancelar espera POST según [HttpPost("{id}/cancelar")]
    return this.http.post<ApiResponse<Poliza>>(url, {}).pipe(
      tap(() => {
        this.invalidatePolizasCache();
        this.polizaEventsService.notifyPolizaChanged();
      })
    );
  }

  /**
   * Invalida el caché relacionado con pólizas
   */
  private invalidatePolizasCache(): void {
    // Invalidar todas las claves que contengan "Polizas" (normalizado como "Polizas")
    // El método invalidateByPattern normaliza el patrón, así que usamos "Polizas" directamente
    const polizasPattern = 'Polizas';
    
    // Invalidar en todas las estrategias
    this.cacheService.invalidateByPattern(polizasPattern, CacheStrategy.MEMORY);
    this.cacheService.invalidateByPattern(polizasPattern, CacheStrategy.LOCAL_STORAGE);
    
    console.log('[Cache] Invalidado caché de pólizas con patrón:', polizasPattern);
  }
}
