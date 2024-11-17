import { Component, Inject } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { SalePage } from '../sale/sale.page';
import { ApiService } from '../services/api.service';
import { NotificationsService } from '../services/notifications.service';
import { OrderDraftComponent } from '../order-draft/order-draft.component';
import { DatabaseService } from '../services/database.service';
import { ProductComponent } from '../product/product.component';
import { CartsComponent } from '../carts/carts.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  camaras: any[] = [];
  cameraDirection: 'front'|'back' = 'back'
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
    this.getCamaras();
    this.getCurrentCart();
    this.openModalOrderDraft();
   
    this.notificationsService.openSale$.subscribe( sale => {
      this.getOrderAndOpenModal(sale.toString());
    })
  }

  async getCamaras() {
    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.camaras = devices.filter( device => device.kind === 'videoinput');
  }

  async setScanDirection() {
    const alert = await this.alertCtrl.create({
      header: 'Seleccionar cámara',
      inputs: [
        {
          name: 'front',
          type: 'radio',
          label: 'Frontal',
          value: 'front',
          checked: this.cameraDirection === 'front'
        },
        {
          name: 'back',
          type: 'radio',
          label: 'Trasera',
          value: 'back',
          checked: this.cameraDirection === 'back'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: (data) => {
            debugger;
            this.cameraDirection = data;
          }
        }
      ]
    });
    await alert.present();
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

            this.dbService.exportToCsv(this.products_cart, 'cart.csv');
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
  async openCarts() {
    const modalRef = await this.modalCtrl.create({
      component: CartsComponent
    })
    await modalRef.present();
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
            inputs: [
              {
                name: 'quantity',
                type: 'number',
                value: '1'
              }
            ],
            message: `
              <strong>Precio:</strong> ${product.price} €<br>
               <strong>PVP:</strong> ${product.pvp} €<br>
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
                  this.openProduct({...product, product_id});
                }
              },
              {
                text: 'Agregar',
                handler: ({quantity}) => {
                  if( !quantity ) return alert('Debes ingresar una cantidad');
                  this.addProductToCart({...product, product_id},  parseInt(quantity) );
                }
              }
            ]
          });
          await alertRef.present();
        } else {
          this.openProduct(null, code);
        }
        
      }).catch( error => {
        console.log(error);
      });
    };

    const allowed = await this.checkPermission();

    if (allowed) {
      this.scanActive = true;
      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan({ cameraDirection : this.cameraDirection });
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

  async addProductToCart( product: any, quantity: number = 1 ) {

    if( !this.current_cart_id ) {
      this.current_cart_id = await this.dbService.createCart();
    }

    const product_in_cart =  this.products_cart.find( p => p.product_id === product.product_id )
    
    if( product_in_cart ) {
      const con = confirm('El producto ya está en el carrito, ¿Deseas agregar más?');
      if( con ) {
        product_in_cart.quantity = product_in_cart.quantity + quantity - 1;
        return this.addOrRemoveQuantityProductCart('increment', product_in_cart.id, product_in_cart.quantity );
      }
      return 
    }
    
    this.dbService.addProductToCart(this.current_cart_id, product, quantity ).then( () => {
      this.getCurrentCart();
    });
    
  }

  async openProduct(product: any, code?: string) {
    const modalRef = await this.modalCtrl.create({
      component: ProductComponent,
      componentProps: { product, code }
    })
    await modalRef.present();
  }

  private async openModalOrderDraft() {
    const modalRef = await this.modalCtrl.create({
      component: OrderDraftComponent,
      initialBreakpoint: 0.69,
      breakpoints: [0.69, 0.75, 1]
    })
    await modalRef.present();
  }
    


  async handleSegment(event: any) {
    const segment = event.detail.value;
    if(segment === 'taller') {
      this.segment = 'taller';
      this.openModalOrderDraft();
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

      const result = await BarcodeScanner.startScan({ cameraDirection: this.cameraDirection });

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
