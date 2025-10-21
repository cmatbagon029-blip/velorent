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
    const token = localStorage.getItem('token');
    // Always land on browse page if no token; login is user-initiated from actions
    if (!token) {
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }
}
