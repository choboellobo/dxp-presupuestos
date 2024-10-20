import { Injectable } from '@angular/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';


@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private openSaleSubject = new Subject<number>();
  openSale$ = this.openSaleSubject.asObservable();

  constructor(
    private api: ApiService
  ) { }

  init()  {
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
        this.listeners();
      } else {
        // Show some error
        alert("Necesitas tener permisos para recibir notificaciones");
      }
    });
  }
  private listeners() {
    PushNotifications.addListener('registration',
      (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        this.api.subscribeTopic(token.value)
          .subscribe( () => console.log('Subscribed to topic') )
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        console.log('Error on registration: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received: ' + JSON.stringify(notification));
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        if( notification.notification.data.sale ){
          setTimeout( () => this.openSaleSubject.next( notification.notification.data.sale ), 1000 )
        } 
      }
    );
  }
}
