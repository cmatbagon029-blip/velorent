import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { documentTextOutline, shieldOutline, logOutOutline } from 'ionicons/icons';

addIcons({ documentTextOutline, shieldOutline, logOutOutline });

@Component({
  selector: 'app-privacy-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>VELORENT Privacy Policy</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h2>VELORENT: Vehicle Rental Management and Booking Platform</h2>
      <p>This Data Privacy Policy describes how VELORENT, a research capstone project developed by students of Westen Leyte College of Ormoc, collected, used, stored, and protected personal data during its development and testing phase. The system was created solely for academic and research purposes, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).</p>

      <h3>1. Types of Data Collected</h3>
      <p>During the development and testing of VELORENT, the system may have collected the following:</p>
      <ul>
        <li>Personal Information: Full name, email address, mobile number, address, and a copy of a valid driver's license</li>
        <li>Booking and Usage Data: Vehicle type, rental date/time, return schedule, and simulated payment data</li>
        <li>Device and Technical Data: IP address, device model, browser or OS information, and app usage behavior</li>
        <li>Location Data: GPS based data used for testing tracking functionality (with user permission)</li>
      </ul>

      <h3>2. Methods of Data Collection</h3>
      <p>Data was gathered through:</p>
      <ul>
        <li>In-app registration and booking forms</li>
        <li>Voluntary participation in user testing</li>
        <li>Automated system logs and analytics tools</li>
        <li>Location services (only during live testing, and with consent)</li>
      </ul>

      <h3>3. Reasons for Data Collection</h3>
      <p>Data was collected to:</p>
      <ul>
        <li>Simulate real world vehicle rental and booking workflows</li>
        <li>Test system features like user authentication, booking, and tracking</li>
        <li>Analyze usability, system performance, and user experience</li>
        <li>Support academic reporting and documentation of research findings</li>
      </ul>

      <h3>4. How Collected Data Was Used</h3>
      <p>Collected data was strictly used for:</p>
      <ul>
        <li>Running system simulations during testing</li>
        <li>Evaluating feature functionality (location tracking, booking confirmation)</li>
        <li>Analyzing usage trends to inform system improvements</li>
        <li>Generating insights for the capstone's written documentation and defense</li>
      </ul>

      <h3>5. Data Sharing and Third Parties</h3>
      <p>No user data was sold or used commercially. Access was strictly limited to:</p>
      <ul>
        <li>The student developers</li>
        <li>Assigned thesis advisers and evaluators</li>
        <li>College administrators if required</li>
      </ul>

      <h3>6. Data Retention</h3>
      <p>Data was retained only for the duration of the project. Upon completion:</p>
      <ul>
        <li>All test user data was either anonymized or permanently deleted</li>
        <li>No identifiable personal information remains in the system or its backups</li>
      </ul>

      <h3>7. User Rights</h3>
      <p>Participants had the right to:</p>
      <ul>
        <li>Access and review the personal data provided</li>
        <li>Request corrections or deletions</li>
        <li>Withdraw participation and request data removal at any time</li>
      </ul>

      <h3>8. Security Measures</h3>
      <p>To protect user data during development and testing, the VELORENT team applied:</p>
      <ul>
        <li>Secure database storage with password access</li>
        <li>Limited access to system logs and admin panels</li>
        <li>Encrypted credentials for test users</li>
        <li>Regular backups during development stored in secure environments</li>
      </ul>

      <h3>9. Policy Updates</h3>
      <p>As a research project, this policy remained consistent during the testing phase. If any changes were made, test users were notified via email or in app messages prior to data collection.</p>

      <h3>10. How to Contact the Team</h3>
      <p>If you have any concerns or questions about this privacy policy or the project:</p>
      <p>VELORENT Project Team<br>
      Email: Alexeimat.laude&#64;wlcormoc.edu.ph<br>
      Institution: Westen Leyte College of Ormoc<br>
      Capstone Adviser: Mr. Ian Avila</p>
    </ion-content>
  `
})
export class PrivacyModalComponent {
  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
}

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>VELORENT Terms and Conditions</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p><strong>Last Updated: May 24, 2025</strong></p>
      <p>Welcome to VELORENT! These Terms and Conditions govern your access to and use of our vehicle rental and booking platform. By accessing or using our platform, you agree to be bound by these Terms.</p>
      
      <h3>1. Acceptance of Terms</h3>
      <p>By creating an account, booking a vehicle, or otherwise using our services, you acknowledge that you have read, understood, and agreed to these Terms and our Privacy Policy. If you do not agree, please do not use the platform.</p>
      
      <h3>2. Right to Modify Terms</h3>
      <p>VELORENT may update these Terms at any time without prior notice. We will notify users of significant changes via email or app notifications. Continued use of the platform constitutes acceptance of the new Terms.</p>
      
      <h3>3. User Responsibilities</h3>
      <p>Users agree to:</p>
      <ul>
        <li>Provide accurate and complete registration information.</li>
        <li>Use VELORENT only for lawful purposes.</li>
        <li>Keep account credentials secure and confidential.</li>
        <li>Respect all terms outlined in this document and in related policies.</li>
      </ul>
      
      <h3>4. Prohibited Actions</h3>
      <p>Users are strictly prohibited from:</p>
      <ul>
        <li>Submitting false information or impersonating others.</li>
        <li>Misusing rental vehicles or violating traffic laws during use.</li>
        <li>Attempting to reverse-engineer or compromise system security.</li>
        <li>Uploading or sharing offensive, unlawful, or copyrighted content.</li>
      </ul>
      
      <h3>5. Intellectual Property Rights</h3>
      <p>All content, design, text, graphics, logos, and software used in VELORENT are the intellectual property of the VELORENT team and may not be copied or reused without express permission.</p>
      
      <h3>6. Account Creation</h3>
      <p>Users must be at least 18 years old and provide a valid driver's license to register. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
      
      <h3>7. Privacy Policy</h3>
      <p>Our Privacy Policy outlines how we collect, store, and use your data. By using our services, you consent to data collection in accordance with the Data Privacy Act of 2012 (RA 10173).</p>
      
      <h3>8. Disclaimers</h3>
      <p>VELORENT is an academic capstone project. Services may be subject to interruptions or testing limitations. We do not guarantee uninterrupted access or performance and disclaim liability for any data loss during testing phases.</p>
      
      <h3>9. Limitation of Liability</h3>
      <p>VELORENT is not liable for damages or losses resulting from:</p>
      <ul>
        <li>Use or inability to use the system</li>
        <li>Inaccurate user inputs or system data</li>
        <li>Breaches caused by user negligence</li>
      </ul>
      
      <h3>10. User Contribution Clause</h3>
      <p>Users may post reviews or feedback. VELORENT reserves the right to moderate or remove content deemed inappropriate, offensive, or in violation of these Terms.</p>
      
      <h3>11. Governing Law and Jurisdiction</h3>
      <p>These Terms are governed by Philippine law. Any disputes arising from the use of VELORENT will be handled in the appropriate local courts within Leyte, Philippines.</p>
      
      <h3>12. Termination</h3>
      <p>VELORENT may suspend or terminate user accounts at any time due to violations of these Terms, fraudulent activity, or misuse of the platform.</p>
      
      <h3>13. Contact Information</h3>
      <p>For questions regarding these Terms, contact:</p>
      <p>VELORENT Project Team<br>
      Email: Alexeimat.laude&#64;wlcormoc.edu.ph<br>
      Institution: Westen Leyte College of Ormoc<br>
      Capstone Adviser: Mr. Ian Avila</p>
    </ion-content>
  `
})
export class TermsModalComponent {
  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonicModule, CommonModule, TermsModalComponent, PrivacyModalComponent],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(
    private router: Router,
    private modalCtrl: ModalController
  ) {}

  async openTermsOfService() {
    const modal = await this.modalCtrl.create({
      component: TermsModalComponent
    });
    return await modal.present();
  }

  async openPrivacyPolicy() {
    const modal = await this.modalCtrl.create({
      component: PrivacyModalComponent
    });
    return await modal.present();
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
  }
} 