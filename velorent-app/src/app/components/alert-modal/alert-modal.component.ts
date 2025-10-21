import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header [class.error-header]="type === 'error'">
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss(false)">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="modal-content">
        <ion-icon 
          [name]="type === 'error' ? 'warning' : 'information-circle'" 
          [color]="type === 'error' ? 'danger' : 'primary'"
          class="modal-icon">
        </ion-icon>
        <p>{{ message }}</p>
      </div>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <div class="button-container">
          <ion-button 
            *ngIf="type === 'info'"
            fill="clear" 
            color="medium" 
            (click)="dismiss(false)">
            Cancel
          </ion-button>
          <ion-button 
            [color]="type === 'error' ? 'danger' : 'primary'"
            (click)="dismiss(true)">
            {{ type === 'info' ? 'Yes' : 'OK' }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .modal-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem;
    }
    .modal-icon {
      font-size: 48px;
      margin-bottom: 1rem;
    }
    .error-header {
      --background: var(--ion-color-danger);
      --color: var(--ion-color-danger-contrast);
    }
    .button-container {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px;
    }
  `]
})
export class AlertModalComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() type: 'error' | 'info' = 'error';

  constructor(private modalCtrl: ModalController) {}

  dismiss(confirmed: boolean) {
    this.modalCtrl.dismiss({ confirmed });
  }
} 