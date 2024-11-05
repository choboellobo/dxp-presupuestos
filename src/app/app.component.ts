import { Component, OnInit } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ModalController, Platform } from '@ionic/angular';
import { OrderDraftComponent } from './order-draft/order-draft.component';
import { NotificationsService } from './services/notifications.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private modalCtrl: ModalController,
    private notificationService: NotificationsService
  ) {
    platform.ready().then(() => {
      this.init();
      if( this.platform.is('android') ) {
        this.notificationService.init();
      }
    })
  }
  ngOnInit() {
    this.openOrderDraft();
  }

  async init() {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({color: '#36363a'})
  }

  async openOrderDraft() {
    const modalRef = await this.modalCtrl.create({
      component: OrderDraftComponent,
      initialBreakpoint: 0.69,
      breakpoints: [0.69, 0.75, 1]
    })
    await modalRef.present();
  }



}
