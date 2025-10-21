import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './terms-of-service.page.html',
  styleUrls: ['./terms-of-service.page.scss']
})
export class TermsOfServicePage {
  constructor() {
    console.log('Terms of Service page loaded');
  }
} 