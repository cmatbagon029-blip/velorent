import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  
  // Check if user is logged in
  const user = localStorage.getItem('user');
  
  if (user) {
    return true; // User is logged in, allow access
  } else {
    // User is not logged in, redirect to login
    router.navigate(['/login']);
    return false;
  }
};