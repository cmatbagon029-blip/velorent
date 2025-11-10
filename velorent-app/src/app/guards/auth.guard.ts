import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  
  // Check if user is logged in
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  console.log('=== AUTH GUARD CHECK ===');
  console.log('User exists:', !!user);
  console.log('Token exists:', !!token);
  
  if (user && token) {
    console.log('User is authenticated, allowing access');
    return true; // User is logged in, allow access
  } else {
    console.log('User not authenticated, redirecting to login');
    // User is not logged in, redirect to login
    router.navigate(['/login']);
    return false;
  }
};