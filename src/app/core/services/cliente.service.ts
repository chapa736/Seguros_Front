import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Cliente, CreateClienteRequest, UpdateClienteRequest, UpdateMyInfoRequest } from '../models/seguros.models';
import { CacheService } from './cache.service';
import { CacheStrategy } from '../models/cache.models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.segurosApiUrl}/clientes`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Cliente[]>> {
    return this.http.get<ApiResponse<Cliente[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Cliente>> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`);
  }

  getByUserId(userId: number): Observable<ApiResponse<Cliente>> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/User/${userId}`);
  }

  create(cliente: CreateClienteRequest): Observable<ApiResponse<Cliente>> {
    return this.http.post<ApiResponse<Cliente>>(this.apiUrl, cliente).pipe(
      tap(() => this.invalidateClientesCache())
    );
  }

  update(id: number, cliente: UpdateClienteRequest): Observable<ApiResponse<Cliente>> {
    return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, cliente).pipe(
      tap(() => this.invalidateClientesCache())
    );
  }

  updateMyInfo(request: UpdateMyInfoRequest): Observable<ApiResponse<Cliente>> {
    const url = `${this.apiUrl}/UpdateMyInfo`;
    const token = localStorage.getItem('token');
    
    console.log('=== ClienteService.updateMyInfo ===');
    console.log('URL completa:', url);
    console.log('Método HTTP: PATCH');
    console.log('Request body:', JSON.stringify(request, null, 2));
    console.log('Token presente:', !!token);
    if (token) {
      console.log('Token completo:', token);
    }
    console.log('===================================');
    
    // El endpoint usa [HttpPatch], no PUT
    return this.http.patch<ApiResponse<Cliente>>(url, request).pipe(
      tap(() => this.invalidateClientesCache())
    );
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.invalidateClientesCache();
        // También invalidar caché de pólizas ya que al eliminar un cliente se eliminan sus pólizas
        this.invalidatePolizasCache();
      })
    );
  }

  /**
   * Invalida el caché relacionado con clientes
   */
  private invalidateClientesCache(): void {
    // Invalidar todas las claves relacionadas con clientes
    const keysToInvalidate = [
      this.cacheService.generateKey(this.apiUrl),
      this.cacheService.generateKey(`${this.apiUrl}/User/`)
    ];
    
    // Invalidar en todas las estrategias
    keysToInvalidate.forEach(key => {
      this.cacheService.remove(key, CacheStrategy.MEMORY);
      this.cacheService.remove(key, CacheStrategy.LOCAL_STORAGE);
    });
    
    console.log('[Cache] Invalidado caché de clientes');
  }

  /**
   * Invalida el caché de pólizas (cuando se elimina un cliente)
   */
  private invalidatePolizasCache(): void {
    // Llamar al método privado de PolizaService usando una técnica de acceso
    // Como no podemos acceder directamente, invalidamos manualmente
    const polizaApiUrl = `${environment.segurosApiUrl}/Polizas`;
    const keysToInvalidate = [
      this.cacheService.generateKey(`${polizaApiUrl}/vigentes`),
      this.cacheService.generateKey(`${polizaApiUrl}/cliente/`),
      this.cacheService.generateKey(`${polizaApiUrl}/tipo/`),
      this.cacheService.generateKey(`${polizaApiUrl}/estatus/`)
    ];
    
    keysToInvalidate.forEach(key => {
      this.cacheService.remove(key, CacheStrategy.MEMORY);
      this.cacheService.remove(key, CacheStrategy.LOCAL_STORAGE);
    });
    
    console.log('[Cache] Invalidado caché de pólizas (por eliminación de cliente)');
  }
}
