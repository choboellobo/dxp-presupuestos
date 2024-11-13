import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  @Input() product: any;
  @Input() code: string = '';
  constructor(
    public modalCtrl: ModalController,
    private db: DatabaseService,
    private alertCtrl: AlertController
  ) { }
  get canSave() {
    return this.product.name.length > 0 && 
    this.product.price > 0 && 
    this.product.cost > 0 && 
    this.product.code.length > 0 &&
    this.product.sku.length > 0
  }

  ngOnInit() {
   if( !this.product ) {
     this.product = {
      name: '',
      price: 0,
      cost: 0,
      code: this.code || '',
      sku: '',
      notes: '',
     }
   }
  }

  async deleteProduct() {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: '¿Estás seguro de eliminar este producto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.db.deleteProduct(this.product.product_id);
            this.modalCtrl.dismiss();
          }
        }
      ]
    });
    await alert.present();
  }

  async saveProduct() {
    if( this.product.product_id ) {
      // update product
      console.log('update product');
      await this.db.updateProduct(this.product);
      this.modalCtrl.dismiss();
    }else {
      // create product
      console.log('create product');
      await this.db.createProduct(this.product);
      this.modalCtrl.dismiss();

    }
  }

}
