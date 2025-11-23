import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-app>
      <ion-router-outlet id="main-content" [animated]="false"></ion-router-outlet>
    </ion-app>
  `
})
export class AppComponent implements OnInit {
  title = 'velorent-app';
  
  constructor(private router: Router, private platform: Platform) {
    console.log('=== APP COMPONENT STARTUP ===');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    // Don't redirect - let router handle navigation
    // This allows user to stay logged in across app restarts
  }

  async ngOnInit() {
    // Hide splash screen with fade animation when app is ready
    if (Capacitor.isNativePlatform()) {
      try {
        // Wait for platform to be ready
        await this.platform.ready();
        
        // Wait for router to be ready and initial navigation to complete
        // This ensures the app content is fully loaded before hiding splash
        setTimeout(async () => {
          try {
            // Wait a bit more to ensure WebView content is rendered
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Hide splash screen with smooth fade animation
            await SplashScreen.hide({
              fadeOutDuration: 500 // 500ms fade-out animation for smoother transition
            });
            console.log('Splash screen hidden - app ready');
          } catch (error) {
            console.error('Error hiding splash screen:', error);
            // Force hide if there's an error
            try {
              await SplashScreen.hide();
            } catch (e) {
              console.error('Error force hiding splash:', e);
            }
          }
        }, 3000); // Show splash for 3 seconds total
      } catch (error) {
        console.error('Error initializing splash screen:', error);
      }
    }
  }
}

