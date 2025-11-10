import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, IonicModule],
  template: `
    <ion-router-outlet id="main-content" [animated]="false"></ion-router-outlet>
  `
})
export class AppComponent {
  title = 'velorent-app';
  constructor(private router: Router) {
    console.log('=== APP COMPONENT STARTUP ===');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    // Don't redirect - let router handle navigation
    // This allows user to stay logged in across app restarts
  }
}

