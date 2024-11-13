import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-carts',
  templateUrl: './carts.component.html',
  styleUrls: ['./carts.component.scss'],
})
export class CartsComponent implements OnInit {
  carts: any[] = [];
  constructor(
    private dbService: DatabaseService,
    public modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.dbService.getCarts().then( carts => {
      this.carts = [];
      carts.docs.forEach( doc => {
        this.carts.push({...doc.data(), id: doc.id});
      });
    });
  }

  getProductCart( cart_id: string, products: any[] ) {
    if( !products ) {
      this.dbService.getProductsCart(cart_id).then( products => {
        console.log(products.docs);
        const index = this.carts.findIndex( cart => cart.id === cart_id );
        this.carts[index].products = [];
        products.docs.forEach( doc => {
          this.carts[index].products.push({...doc.data(), id: doc.id});
        });
        console.log( this.carts[index] );
      });
    }
  }

  generateCsv(products: any[]) {
    this.dbService.nativeExportToCsv( products );
  }

}
