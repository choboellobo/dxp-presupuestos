import { Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { SalePage } from '../sale/sale.page';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-order-draft',
  templateUrl: './order-draft.component.html',
  styleUrls: ['./order-draft.component.scss'],
})
export class OrderDraftComponent implements OnInit {
  person_selected: string = 'null';
  private _orders: any[] = []
  public orders: any[] = []
  order!: string;
  people: string[] = []
  constructor(
    public modalCtrl: ModalController,
    private apiService: ApiService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.getOrderDraft();
  }

  async getOrderDraft() {
    const loadingRef = await this.loadingCtrl.create({message: 'Espere...'});
    await loadingRef.present();
    this.apiService.ordersDraft().subscribe( (data: any) => {
      this.orders = data;
      this._orders = data;
      console.log(data)

      for(const order of this._orders) {
        if( order.activity_user_id) {
           if( this.people.some( name => name == order.activity_user_id[1]) ) {
            continue;
           }else {
            this.people.push(order.activity_user_id[1])
           }
        }
      }
      const person_selected_storage = localStorage.getItem("person_selected");
      if( person_selected_storage && person_selected_storage != 'null') {
        this.person_selected = person_selected_storage;
        this.filterOrders()
      }

      loadingRef.dismiss();
    }, error => {
      loadingRef.dismiss();
      alert("Hubo un error")
    })
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

  openOrder(id: number) {
    this.order = id.toString();
    this.getOrderAndOpenModal(this.order)
    //this.modalCtrl.dismiss()
    setTimeout(() => this.order = '', 2000)
  }


  filterOrders() {

    if( this.person_selected == 'null') {
      localStorage.setItem('person_selected', this.person_selected);
      this.orders = this._orders;
    }else {
      localStorage.setItem('person_selected', this.person_selected);
      this.orders = this._orders.filter( order => order.activity_user_id && order.activity_user_id[1] == this.person_selected )
    }
  }

}
