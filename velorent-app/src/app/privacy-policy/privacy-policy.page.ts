import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Privacy Policy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="privacy-content">
        <h1>VELORENT: Vehicle Rental Management and Booking Platform</h1>
        <h2>Data Privacy Policy</h2>
        
       

        <p class="date">May 24, 2025</p>

        <section>
          <p class="introduction">
            This Data Privacy Policy describes how VELORENT, a research capstone project developed by students of Westen Leyte College of Ormoc, collected, used, stored, and protected personal data during its development and testing phase. The system was created solely for academic and research purposes, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).
          </p>
        </section>

        <section>
          <h2>1. Types of Data Collected</h2>
          <p>During the development and testing of VELORENT, the system may have collected the following:</p>
          <ul>
            <li>Personal Information: Full name, email address, mobile number, address, and a copy of a valid driver's license</li>
            <li>Booking and Usage Data: Vehicle type, rental date/time, return schedule, and simulated payment data</li>
            <li>Device and Technical Data: IP address, device model, browser or OS information, and app usage behavior</li>
            <li>Location Data: GPS based data used for testing tracking functionality (with user permission)</li>
          </ul>
        </section>

        <section>
          <h2>2. Methods of Data Collection</h2>
          <p>Data was gathered through:</p>
          <ul>
            <li>In-app registration and booking forms</li>
            <li>Voluntary participation in user testing</li>
            <li>Automated system logs and analytics tools</li>
            <li>Location services (only during live testing, and with consent)</li>
          </ul>
        </section>

        <section>
          <h2>3. Reasons for Data Collection</h2>
          <p>Data was collected to:</p>
          <ul>
            <li>Simulate real world vehicle rental and booking workflows</li>
            <li>Test system features like user authentication, booking, and tracking</li>
            <li>Analyze usability, system performance, and user experience</li>
            <li>Support academic reporting and documentation of research findings</li>
          </ul>
        </section>

        <section>
          <h2>4. How Collected Data Was Used</h2>
          <p>Collected data was strictly used for:</p>
          <ul>
            <li>Running system simulations during testing</li>
            <li>Evaluating feature functionality (location tracking, booking confirmation)</li>
            <li>Analyzing usage trends to inform system improvements</li>
            <li>Generating insights for the capstone's written documentation and defense</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Sharing and Third Parties</h2>
          <p>No user data was sold or used commercially. Access was strictly limited to:</p>
          <ul>
            <li>The student developers</li>
            <li>Assigned thesis advisers and evaluators</li>
            <li>College administrators if required</li>
          </ul>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>Data was retained only for the duration of the project. Upon completion:</p>
          <ul>
            <li>All test user data was either anonymized or permanently deleted</li>
            <li>No identifiable personal information remains in the system or its backups</li>
          </ul>
        </section>

        <section>
          <h2>7. User Rights</h2>
          <p>Participants had the right to:</p>
          <ul>
            <li>Access and review the personal data provided</li>
            <li>Request corrections or deletions</li>
            <li>Withdraw participation and request data removal at any time</li>
          </ul>
        </section>

        <section>
          <h2>8. Security Measures</h2>
          <p>To protect user data during development and testing, the VELORENT team applied:</p>
          <ul>
            <li>Secure database storage with password access</li>
            <li>Limited access to system logs and admin panels</li>
            <li>Encrypted credentials for test users</li>
            <li>Regular backups during development stored in secure environments</li>
          </ul>
        </section>

        <section>
          <h2>9. Policy Updates</h2>
          <p>As a research project, this policy remained consistent during the testing phase. If any changes were made, test users were notified via email or in app messages prior to data collection.</p>
        </section>

        <section>
          <h2>10. How to Contact the Team</h2>
          <p>If you have any concerns or questions about this privacy policy or the project:</p>
          <div class="contact-info">
            <p>VELORENT Project Team</p>
            <p>Email: Alexeimat.laude&#64;wlcormoc.edu.ph</p>
            <p>Institution: Westen Leyte College of Ormoc</p>
            <p>Capstone Adviser: Mr. Ian Avila</p>
          </div>
        </section>

        <section>
          <h2>11. Legal Compliance</h2>
          <p>VELORENT was developed with reference to and in compliance with:</p>
          <ul>
            <li>The Data Privacy Act of 2012 (RA 10173)</li>
            <li>The Implementing Rules and Regulations of the National Privacy Commission (NPC)</li>
          </ul>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .privacy-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      color: var(--ion-color-primary);
      margin-bottom: 10px;
      text-align: center;
    }

    h2 {
      color: var(--ion-color-primary);
      margin: 20px 0 15px;
      font-size: 1.2em;
    }

    .authors, .submitted-to {
      margin: 20px 0;
    }

    .date {
      text-align: center;
      font-weight: bold;
      margin: 20px 0;
    }

    .introduction {
      font-style: italic;
      margin-bottom: 30px;
    }

    section {
      margin-bottom: 30px;
    }

    ul {
      padding-left: 20px;
      margin: 10px 0;
    }

    li {
      margin-bottom: 8px;
      line-height: 1.4;
    }

    p {
      line-height: 1.6;
      margin-bottom: 15px;
    }

    .contact-info {
      padding: 20px;
      margin-top: 10px;
    }

    .contact-info p {
      margin: 8px 0;
      color: var(--ion-color-dark);
      font-size: 1rem;
      line-height: 1.5;
    }

    .contact-info p:first-child {
      font-weight: bold;
      color: var(--ion-color-primary);
      font-size: 1.1rem;
      margin-bottom: 12px;
    }

    .contact-info p:nth-child(2) {
      color: var(--ion-color-dark);
      font-weight: 500;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class PrivacyPolicyPage {
  currentDate = new Date().toLocaleDateString();
} 