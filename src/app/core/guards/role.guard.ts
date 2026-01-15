import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { AuthState } from '../../store/auth.state';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store);
  const router = inject(Router);
  
  const user = store.selectSnapshot(AuthState.user);
  const requiredRole = route.data['role'];
  
  if (!user || !user.roles.some(r => r.nombre === requiredRole)) {
    router.navigate(['/']);
    return false;
  }
  
  return true;
};
