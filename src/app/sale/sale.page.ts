import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.page.html',
  styleUrls: ['./sale.page.scss'],
})
export class SalePage implements OnInit {
  @Input() sale: any;
  line: string = '';
  modalNote: boolean = false;
  modalProduct: boolean = false;
  quantity: number = 1;
  price!: number | null;
  partner: any;
  constructor(
    private apiService: ApiService,
    public modalCtrl: ModalController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    const partner_id = this.sale.partner_id[0];
    this.apiService.partner(partner_id)
      .subscribe( (data: any ) => {
        this.partner = data[0]
      } )
  }

  async update() {
    this.apiService.getSale(this.sale.id).subscribe( sale => this.sale = sale )
  }

  status( status: string) {
    switch(status) {
      case 'draft':
        return 'En proceso'
      case 'sale':
        return 'Terminada';
      case 'cancel':
        return 'Cancelada';
      default:
        return 'Sin status'
    }
  }

  async addLineNote() {
    if( this.line )  {
      const loading = await this.loadingCtrl.create();
      await loading.present();
      this.apiService.addLineNote(this.sale.id, this.line ).subscribe( sale => {
        loading.dismiss();
        this.closeModal();
        this.update();
      })
    }
  }

  async addLineProduct() {
    if( this.line && this.quantity && this.price )  {
      const loading = await this.loadingCtrl.create();
      await loading.present();
      this.apiService.addLineProduct(this.sale.id, this.line, this.quantity, this.price ).subscribe( sale => {
        loading.dismiss();
        this.closeModal();
        this.update();
      })
    }

  }
  async endTask() {
    const loading = await this.loadingCtrl.create({message: 'Espera...'})
    await loading.present();
    this.apiService.endTask(this.sale.id)
      .subscribe(
        sale => {
          loading.dismiss();
          this.update();
        }
      )
  }

  closeModal() {
    this.modalNote = false;
    this.modalProduct = false;
    this.quantity = 1;
    this.price = null;
    this.line = '';
  }

  openWhatsapp(phone: string) {
    const _phone = phone.replace('+', '');
    window.open('https://wa.me/' + _phone )
  }

}
