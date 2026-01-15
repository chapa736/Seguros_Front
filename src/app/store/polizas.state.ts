import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { PolizaService } from '../core/services/poliza.service';
import { Poliza, CreatePolizaRequest } from '../core/models/seguros.models';

export class LoadPolizas {
  static readonly type = '[Polizas] Load';
}

export class LoadPolizasByCliente {
  static readonly type = '[Polizas] Load By Cliente';
  constructor(public clienteId: number) {}
}

export class CreatePoliza {
  static readonly type = '[Polizas] Create';
  constructor(public poliza: CreatePolizaRequest) {}
}

export class UpdatePoliza {
  static readonly type = '[Polizas] Update';
  constructor(public id: number, public poliza: Partial<CreatePolizaRequest>) {}
}

export class DeletePoliza {
  static readonly type = '[Polizas] Delete';
  constructor(public id: number) {}
}

export interface PolizasStateModel {
  polizas: Poliza[];
  loading: boolean;
}

@State<PolizasStateModel>({
  name: 'polizas',
  defaults: {
    polizas: [],
    loading: false
  }
})
@Injectable()
export class PolizasState {
  constructor(private polizaService: PolizaService) {}

  @Selector()
  static polizas(state: PolizasStateModel) {
    return state.polizas;
  }

  @Selector()
  static loading(state: PolizasStateModel) {
    return state.loading;
  }

  @Action(LoadPolizas)
  loadPolizas(ctx: StateContext<PolizasStateModel>) {
    ctx.patchState({ loading: true });
    return this.polizaService.getAll().pipe(
      tap(response => {
        ctx.patchState({
          polizas: response.data,
          loading: false
        });
      })
    );
  }

  @Action(LoadPolizasByCliente)
  loadPolizasByCliente(ctx: StateContext<PolizasStateModel>, action: LoadPolizasByCliente) {
    ctx.patchState({ loading: true });
    return this.polizaService.getByClienteId(action.clienteId).pipe(
      tap(response => {
        ctx.patchState({
          polizas: response.data,
          loading: false
        });
      })
    );
  }

  @Action(CreatePoliza)
  createPoliza(ctx: StateContext<PolizasStateModel>, action: CreatePoliza) {
    return this.polizaService.create(action.poliza).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          ctx.patchState({
            polizas: [...state.polizas, response.data]
          });
        }
      })
    );
  }

  @Action(UpdatePoliza)
  updatePoliza(ctx: StateContext<PolizasStateModel>, action: UpdatePoliza) {
    return this.polizaService.update(action.id, action.poliza).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          const polizas = state.polizas.map(p => 
            p.id === action.id ? response.data : p
          );
          ctx.patchState({ polizas });
        }
      })
    );
  }

  @Action(DeletePoliza)
  deletePoliza(ctx: StateContext<PolizasStateModel>, action: DeletePoliza) {
    return this.polizaService.delete(action.id).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          ctx.patchState({
            polizas: state.polizas.filter(p => p.id !== action.id)
          });
        }
      })
    );
  }
}
