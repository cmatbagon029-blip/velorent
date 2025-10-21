import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  chatbubbleOutline,
  businessOutline,
  timeOutline,
  arrowBackOutline
} from 'ionicons/icons';

// Register icons
addIcons({ 
  'chatbubble-outline': chatbubbleOutline,
  'business-outline': businessOutline,
  'time-outline': timeOutline,
  'arrow-back-outline': arrowBackOutline
});

interface ChatContact {
  id: number;
  name: string;
  type: 'company' | 'admin';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss']
})
export class ChatPage implements OnInit {
  contacts: ChatContact[] = [];
  loading = true;

  constructor(
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    // Start with empty contacts - no placeholders
    this.contacts = [];
    this.loading = false;
  }

  selectContact(contact: ChatContact) {
    // For now, just mark messages as read when clicked
    // In the future, this could navigate to a detailed chat view
    contact.unreadCount = 0;
    console.log('Selected contact:', contact.name);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }

  getTotalUnreadCount(): number {
    return this.contacts.reduce((total, contact) => total + contact.unreadCount, 0);
  }


  // Back navigation
  goBack() {
    this.router.navigate(['/notifications']);
  }
}
