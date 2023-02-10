import { Component } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform
  ) {
    platform.ready().then(() => {
      this.init();
    })
  }

  async init() {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({color: '#36363a'})
  }

}
