import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptorFn } from './app/services/auth.interceptor';
import { addIcons } from 'ionicons';
import { 
  home, 
  searchOutline, 
  carOutline, 
  personOutline,
  personCircleOutline,
  notificationsOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  warningOutline,
  timeOutline,
  businessOutline,
  closeOutline,
  sendOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  addOutline,
  arrowBackOutline,
  star,
  close
} from 'ionicons/icons';

// Register global icons
addIcons({ 
  home, 
  'search-outline': searchOutline, 
  'car-outline': carOutline, 
  'person-outline': personOutline,
  'person-circle-outline': personCircleOutline,
  'notifications-outline': notificationsOutline,
  'chatbubble-outline': chatbubbleOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'information-circle-outline': informationCircleOutline,
  'warning-outline': warningOutline,
  'time-outline': timeOutline,
  'business-outline': businessOutline,
  'close-outline': closeOutline,
  'send-outline': sendOutline,
  'checkmark-done-outline': checkmarkDoneOutline,
  'checkmark-outline': checkmarkOutline,
  'add-outline': addOutline,
  'arrow-back-outline': arrowBackOutline,
  star,
  close
});

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular({
      animated: false,
      mode: 'ios',
      rippleEffect: false,
      swipeBackEnabled: false
    }),
    provideHttpClient(withInterceptors([authInterceptorFn])),
    provideRouter(routes)
  ]
});
