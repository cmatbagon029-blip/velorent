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
    console.log('AppComponent ngOnInit - starting initialization');
    
    // Ensure router navigates to initial route
    this.router.events.subscribe(event => {
      console.log('Router event:', event.constructor.name);
    });
    
    // Hide splash screen with fade animation when app is ready
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('Native platform detected, initializing splash screen');
        // Wait for platform to be ready
        await this.platform.ready();
        console.log('Platform ready');
        
        // Ensure initial navigation happens
        if (!this.router.url || this.router.url === '/') {
          console.log('Navigating to dashboard...');
          this.router.navigate(['/dashboard']).then(() => {
            console.log('Navigation to dashboard completed');
          }).catch(err => {
            console.error('Navigation error:', err);
          });
        }
        
        // Wait for router to be ready and initial navigation to complete
        // This ensures the app content is fully loaded before hiding splash
        setTimeout(async () => {
          try {
            console.log('Waiting for content to render...');
            // Wait longer for Android to ensure content is fully rendered
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('Hiding splash screen...');
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
        }, 3500); // Increased to 3.5 seconds for Android to ensure content renders
      } catch (error) {
        console.error('Error initializing splash screen:', error);
      }
    } else {
      console.log('Web platform - splash screen handling skipped');
    }
  }
}

