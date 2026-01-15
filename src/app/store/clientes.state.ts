import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { ClienteService } from '../core/services/cliente.service';
import { Cliente } from '../core/models/seguros.models';

export class LoadClientes {
  static readonly type = '[Clientes] Load';
}

export class CreateCliente {
  static readonly type = '[Clientes] Create';
  constructor(public cliente: any) {}
}

export class UpdateCliente {
  static readonly type = '[Clientes] Update';
  constructor(public id: number, public cliente: any) {}
}

export class DeleteCliente {
  static readonly type = '[Clientes] Delete';
  constructor(public id: number) {}
}

export interface ClientesStateModel {
  clientes: Cliente[];
  loading: boolean;
}

@State<ClientesStateModel>({
  name: 'clientes',
  defaults: {
    clientes: [],
    loading: false
  }
})
@Injectable()
export class ClientesState {
  constructor(private clienteService: ClienteService) {}

  @Selector()
  static clientes(state: ClientesStateModel) {
    return state.clientes;
  }

  @Selector()
  static loading(state: ClientesStateModel) {
    return state.loading;
  }

  @Action(LoadClientes)
  loadClientes(ctx: StateContext<ClientesStateModel>) {
    ctx.patchState({ loading: true });
    return this.clienteService.getAll().pipe(
      tap(response => {
        ctx.patchState({
          clientes: response.data,
          loading: false
        });
      })
    );
  }

  @Action(CreateCliente)
  createCliente(ctx: StateContext<ClientesStateModel>, action: CreateCliente) {
    return this.clienteService.create(action.cliente).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          ctx.patchState({
            clientes: [...state.clientes, response.data]
          });
        }
      })
    );
  }

  @Action(UpdateCliente)
  updateCliente(ctx: StateContext<ClientesStateModel>, action: UpdateCliente) {
    return this.clienteService.update(action.id, action.cliente).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          const clientes = state.clientes.map(c => 
            c.id === action.id ? response.data : c
          );
          ctx.patchState({ clientes });
        }
      })
    );
  }

  @Action(DeleteCliente)
  deleteCliente(ctx: StateContext<ClientesStateModel>, action: DeleteCliente) {
    return this.clienteService.delete(action.id).pipe(
      tap(response => {
        if (response.success) {
          const state = ctx.getState();
          ctx.patchState({
            clientes: state.clientes.filter(c => c.id !== action.id)
          });
        }
      })
    );
  }
}
