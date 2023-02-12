import { Component } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { LoadingController, ModalController } from '@ionic/angular';
import { SalePage } from '../sale/sale.page';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  scanActive: boolean = false;
  order: string = '';
  constructor(
    private apiService: ApiService,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {}


  async checkPermission() {
    return new Promise(async (resolve, reject) => {
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (status.granted) {
        resolve(true);
      } else if (status.denied) {
        BarcodeScanner.openAppSettings();
        resolve(false);
      }
    });
  }

  async startScanner() {
    const allowed = await this.checkPermission();

    if (allowed) {
      this.scanActive = true;
      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        this.scanActive = false;
        const qr = result.content as string;
        console.log(qr)
        this.getOrderAndOpenModal(qr);
      } else {
        alert('NO DATA FOUND!');
      }
    } else {
      alert('AUTORIZA LA CAMARA');
    }
  }

  stopScanner() {
    BarcodeScanner.stopScan();
    this.scanActive = false;
  }

  ionViewWillLeave() {
    BarcodeScanner.stopScan();
    this.scanActive = false;
  }

  async getOrderAndOpenModal(order_id: string) {
    const loadingRef = await this.loadingCtrl.create({'message': 'Espere...'})
    await loadingRef.present();
    console.log(order_id);
    this.apiService.getSale(order_id).subscribe( 
      async sale => {
        await loadingRef.dismiss();
        const modalRef = await this.modalCtrl.create({
          component: SalePage,
          componentProps: { sale }
        })
        await modalRef.present();
    }, 
    error => {
      loadingRef.dismiss();
       alert("La order no existe")
    })
  }

  searchOrder() {
    if( this.order ) {
      this.getOrderAndOpenModal(this.order);
    }
  }

}
