import { Component, Inject } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { SalePage } from '../sale/sale.page';
import { ApiService } from '../services/api.service';
import { NotificationsService } from '../services/notifications.service';
import { OrderDraftComponent } from '../order-draft/order-draft.component';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  scanActive: boolean = false;
  order: string = '';
  segment: 'taller'|'almacen' = 'taller';
  current_cart_id! : string;
  products_cart: any[] = [];

  constructor(
    private alertCtrl: AlertController,
    private apiService: ApiService,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private notificationsService: NotificationsService,
    private dbService: DatabaseService
  ) {
    
      this.getCurrentCart();
   
    this.notificationsService.openSale$.subscribe( sale => {
      this.getOrderAndOpenModal(sale.toString());
    })
  }


  /* CART */
  getCurrentCart() {

    this.dbService.getCurrentCart().then( carts => {
      if( carts.docs.length > 0 ) {
        this.products_cart = [];
        const cart_id = carts.docs[0].id;
        this.current_cart_id = cart_id;
        this.dbService.getProductsCart(cart_id).then( products => {
          products.docs.forEach( doc => {
            console.log(doc.data());
            this.products_cart.push({...doc.data(), id: doc.id});
          });
        });
      } else {
        this.current_cart_id  = '';
        this.products_cart = [];
      }
    })

  }

  addOrRemoveQuantityProductCart( action: 'increment'|'decrement', product_id: string, quantity: number) {
    if( action === 'increment') {
      quantity++;
    } else {
      quantity--;
    }
    if( quantity < 1 ) {
      return;
    }
    this.dbService.updateQuantityProductCart(this.current_cart_id, product_id, quantity).then( () => {
      this.products_cart = this.products_cart.map( product => {
        if( product.id === product_id ) {
          return {...product, quantity};
        } else {
          return product;
        }
      });
    });

  }

  async deleteProductCart( product_id: string ) {
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
          handler: () => {
            this.dbService.deleteProductCart(this.current_cart_id, product_id).then( () => {
              this.products_cart = this.products_cart.filter( product => product.id !== product_id );
            })
          }
        }
      ]
    });
    await alert.present();
  }

  async setCartNotActive() {
    const alertRef = await this.alertCtrl.create({
      header: 'Finalizar Pedido',
      message: '¿Estás seguro de finalizar el pedido?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Finalizar',
          handler: () => {

            this.exportToCsv(this.products_cart, 'cart.csv');
            this.dbService.setCartNotActive(this.current_cart_id).then( () => {
              this.getCurrentCart();
            });

          }
        }
      ]
    });
    await alertRef.present();
   
  }

  handleRefresh(event: any) {
    this.getCurrentCart();
    event.target.complete();
  }

  /* PRODUCTS */
  async searchProductByCode() {
    const _exe = (code: string) => {
      this.dbService.getProductByCode( code ).then( async products => {
        if( products.docs.length > 0 ) {
          const product_id = products.docs[0].id;
          const product = products.docs[0].data() as any
          const alertRef = await this.alertCtrl.create({
            header: product.name,
            message: `
              <strong>Precio:</strong> ${product.price} €<br>
              <strong>Costo:</strong> ${product.cost} €<br>
              <strong>SKU:</strong> ${product.sku}<br>
              <strong>Notas:</strong> ${product.notes}<br>
            `,
            buttons: [
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Editar',
                handler: () => {
                  
                }
              },
              {
                text: 'Agregar',
                handler: () => {
                  this.addProductToCart({...product, product_id});
                }
              }
            ]
          });
          await alertRef.present();
        } else {
          console.log('No se encontró el producto');
        }
        
      }).catch( error => {
        console.log(error);
      });
    };
    const allowed = await this.checkPermission();
    if (allowed) {
      this.scanActive = true;
      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan();
       console.log( result);
      if (result.hasContent) {
        this.scanActive = false;
        const code = result.content as string;
        _exe(code);
      } else {
        alert('NO DATA FOUND!');
      }
    } else {
      alert('AUTORIZA LA CAMARA');
    }

    
  }

  async addProductToCart( product: any ) {

    if( !this.current_cart_id ) {
      this.current_cart_id = await this.dbService.createCart();
    }

    const product_in_cart =  this.products_cart.find( p => p.product_id === product.product_id )
    if( product_in_cart ) {

      return this.addOrRemoveQuantityProductCart('increment', product_in_cart.id, product_in_cart.quantity );
    }
    this.dbService.addProductToCart(this.current_cart_id, product).then( () => {
      this.getCurrentCart();
    });
    
  }


  async handleSegment(event: any) {
    const segment = event.detail.value;
    if(segment === 'taller') {
      this.segment = 'taller';
      

        const modalRef = await this.modalCtrl.create({
          component: OrderDraftComponent,
          initialBreakpoint: 0.69,
          breakpoints: [0.69, 0.75, 1]
        })
        await modalRef.present();
      
      
    }
    if(segment === 'almacen') {
      this.segment = 'almacen';
    }
    console.log(event);
  }

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



  private exportToCsv(data: any[], filename: string = 'data.csv'): void {
    if (!data || !data.length) {
      console.error('No data provided');
      return;
    }

    // Obtener los encabezados (keys) del primer objeto del array
    const headers = Object.keys(data[0]);
    // Crear una fila de encabezado separada por comas
    const csvRows = [headers.join(',')];

    // Recorrer cada fila de datos para construir el CSV
    data.forEach(row => {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '""'); // Escapar comillas dobles
        return `"${escaped}"`; // Envolver cada valor en comillas dobles
      });
      csvRows.push(values.join(','));
    });

    // Crear un blob de los datos en formato CSV
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });

    // Crear una URL de descarga
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    window.URL.revokeObjectURL(url);
    a.remove();
  };


}
