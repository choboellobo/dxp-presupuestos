import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
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

  line_note_edit!: number;
  line_draft_edit!: number;
  constructor(
    private apiService: ApiService,
    public modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) { }

  ngOnInit() {
    this.getData();
  }

  getData() {
    const partner_id = this.sale.partner_id[0];
    this.apiService.partner(partner_id)
      .subscribe( (data: any ) => {
        this.partner = data[0];
        if( !this.partner.phone_sanitized ) {
          const phone = this.partner.name.match(/[0-9]{9}\s/) 
          this.partner.phone_sanitized = phone ? '+34'+phone[0] : false
        }
      } )
  }

  goHome() {
    window.location.reload();
  }

  async update() {
    const id: string = this.sale.id.toString();
    this.apiService.getSale(id).subscribe( sale => this.sale = sale )
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

  async acceptDraft() {
    const loading = await this.loadingCtrl.create({message: 'Espera...'})
    await loading.present();
    this.apiService.acceptDraft(this.sale.id)
      .subscribe(
        sale => {
          loading.dismiss();
          this.update();
        }
      )
  }

  async cancelDraft() {
    const loading = await this.loadingCtrl.create({message: 'Espera...'})
    await loading.present();
    this.apiService.cancelDraft(this.sale.id)
      .subscribe(
        sale => {
          loading.dismiss();
          this.update();
        }
      )
  }


  async endTask() {
    const loading = await this.loadingCtrl.create({message: 'Espera...'})
    await loading.present();
    this.apiService.endTask(this.sale.id)
      .subscribe(
        sale => {
          loading.dismiss();
          this.setActivityCancel();
          this.update();
        }
      )
  }

  async deleteLine(line_id: number) {
    const alertRef = await this.alertCtrl.create({
      header: 'Borrar linea',
      message: '¿Desea borrar esta linea?',
      buttons: [
        'Cancelar',
        {
          text: 'Si, Borrar',
          handler: () => {
            this.apiService.deleteLine( line_id)
              .subscribe( () => {
                this.update();
              })
          }
        }
      ]
    })
    await alertRef.present();
  }

  closeModal() {
    this.modalNote = false;
    this.modalProduct = false;
    this.quantity = 1;
    this.price = null;
    this.line = '';
  }

  async getLink() {
    const loading = await this.loadingCtrl.create({message: 'Generando enlace...'})
    await loading.present();
    this.apiService.getLink(this.sale.id)
      .subscribe( async (data: any) => {
        await loading.dismiss()
        const regex = /access_token=([^&]+)/;
        const match = data[0].share_link.match(regex);
        
        if (match) {
          const accessToken = match[1];
          console.log("Access Token:", accessToken);
          this.sale.access_token = accessToken;
        } else {
          console.log("Access Token no encontrado");
        }
        
      })
  }

  openWhatsapp(phone: string, message: string = '') {
    const _phone = phone.replace('+', '');
    window.open('https://wa.me/' + _phone + '?text=' + encodeURIComponent(message) );
  }

  async openWhatsappCancel(phone: string) {
    const alertRef  = await this.alertCtrl.create({
      header: 'Enviar Whatsapp',
      subHeader: phone,
      inputs: [
        {
          type: 'textarea',
          name: 'message',
          value: `DXP Urban Mobility te informa, que la reparación número ${this.sale.id } de tu vehículo NO FUE ACEPTADA. Su vehiculo esta listo para recoger, de no ser retirado en 7 días desde hoy su vehiculo se mandara al depósito como vehículo abandonado, recuerda estamos en Calle General Almirante 3, 47003 Valladolid,
https://shorturl.at/gpsY9 \n Nos ayuda muchísimo tu opinión.\n Muchas gracias por confiar en nosotros.`
        }
      ],
      buttons: [
        'Cancelar',
        {
          text: "Enviar",
          handler: ({message}) => {
            const _phone = phone.replace('+', '');
            const url = 'https://wa.me/' + _phone.trim() + '?text=' + encodeURIComponent(message)
            window.open(url )
          }
        }
      ]
    })
    await alertRef.present();

  }

  async openWhatsappPresupuesto(phone: string) {
    const b64id = btoa(this.sale.id.toString())
    const PRESUPUESTO_URL = 'https://presupuestos-dxp.web.app/' + b64id;
    const alertRef  = await this.alertCtrl.create({
      header: 'Enviar Whatsapp',
      subHeader: phone,
      inputs: [
        {
          type: 'textarea',
          name: 'message',
          value: `DXP Urban Mobility te informa, que tienes que *AÑADIR NUESTRO NÚMERO DE WHATSAPP* para ver el *ENLACE* del presupuesto ${this.sale.id} \n\n ${PRESUPUESTO_URL} \n\n Para proceder a la repación es necesario que aceptes el presupuesto, entrando en el enlace y pulsando el boton de ACEPTAR PRESUPUESTO.\n Gracias por confiar en nosotros, un saludo.`
        }
      ],
      buttons: [
        'Cancelar',
        {
          text: "Enviar",
          handler: ({message}) => {
            if( this.sale.state === 'draft'  && !this.sale.access_token ) {
              this.getLink();
            }
            const _phone = phone.replace('+', '');
            const url = 'https://wa.me/' + _phone.trim() + '?text=' + encodeURIComponent(message)
            window.open(url )
          }
        }
      ]
    })
    await alertRef.present();
  }

  async openWhatsappEnd(phone: string) {
    const alertRef  = await this.alertCtrl.create({
      header: 'Enviar Whatsapp',
      subHeader: phone,
      inputs: [
        {
          type: 'textarea',
          name: 'message',
          value: `DXP Urban Mobility te informa, que la reparación número ${this.sale.id } de tu vehículo ya ha finalizado. Puedes pasar ya a recogerlo, recuerda estamos en Calle General Almirante 3, 47003 Valladolid,
https://shorturl.at/gpsY9 \n Nos ayuda muchísimo tu opinión. Valora con una reseña tu experiencia en el siguiente enlace: https://g.page/r/CVx6TLRUhQKoEB0/review \n Muchas gracias por confiar en nosotros.`
        }
      ],
      buttons: [
        'Cancelar',
        {
          text: "Enviar",
          handler: ({message}) => {
            const _phone = phone.replace('+', '');
            const url = 'https://wa.me/' + _phone.trim() + '?text=' + encodeURIComponent(message)
            window.open(url )
          }
        }
      ]
    })
    await alertRef.present();
  }

  async editLineNote() {
    const loadingRef = await this.loadingCtrl.create();
    await loadingRef.present();

    this.apiService.updateLine( this.line_note_edit.toString() , { name: this.line }) 
      .subscribe( () =>  {
        loadingRef.dismiss();
        this.update();
      })
    // Editar linea
    this.modalNote = false;
    this.line_note_edit = null as any;
    this.line = null as any;
  }

  async editLineProduct() {
    const loadingRef = await this.loadingCtrl.create();
    await loadingRef.present();
    const body = {
      name: this.line,
      product_uom_qty: this.quantity,
      price_unit: this.price
    }
    this.apiService.updateLine( this.line_draft_edit.toString() , body ) 
    .subscribe( () =>  {
      loadingRef.dismiss();
      this.update();
    })


    this.modalProduct = false;
    this.line_draft_edit = null as any;
    this.line = null as any;
    this.price = null as any;
    this.quantity = null as any;
  }

  async setActivity() {
    const message = `Ha comenzado la reparación de su vehículo, le avisaremos en cuanto esté listo para que pueda venir a recogerlo, un saludo.`
    const loadingRef = await this.loadingCtrl.create();
    await loadingRef.present();
    this.apiService.setActivity( this.sale.id.toString() )
      .subscribe( () => {
        loadingRef.dismiss();
        this.update();
        this.openWhatsapp(this.partner.phone_sanitized, message);
      })
  }

  async setActivityCancel() {
    const loadingRef = await this.loadingCtrl.create();
   
    const id = this.sale.activity_ids[0];
    if( id ) {
      await loadingRef.present();
      this.apiService.deleteActivity( id )
      .subscribe( () => {
        loadingRef.dismiss();
        this.update();
      })
    }
    
  }



}
