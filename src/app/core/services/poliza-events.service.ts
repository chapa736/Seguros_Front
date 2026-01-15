import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolizaEventsService {
  private polizaChangedSubject = new Subject<void>();
  public polizaChanged$ = this.polizaChangedSubject.asObservable();

  /**
   * Notifica que una póliza ha sido modificada (creada, actualizada, cancelada, eliminada)
   */
  notifyPolizaChanged(): void {
    this.polizaChangedSubject.next();
  }
}
