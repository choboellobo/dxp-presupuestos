import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = 'https://europe-west3-presupuestos-dxp.cloudfunctions.net/app';
  constructor(
    private http: HttpClient
  ) { }

  getSale(id: string) { 
    let _id = id.replace('\x00', '');
    const url = this.url + '/sale/' +  _id;
    return this.http.get(url)
  }

  addLineProduct(id: string, line: string, quantiy: number, price: number) {
     const body = {
      "order_id": id, 
      "company_id": 1,
      "currency_id": 1,
      "state": "draft",
      "display_type": false,
      "name": line,
      "product_id" : 6,
      "product_uom" : 1,
      "product_uom_qty" : quantiy,
      "price_unit" : price
    }
    return this.http.post( this.url + '/sale-line' , body )
  }

  addLineNote(id: string, line: string) {
    const body = {
       "order_id": id, 
       "company_id": 1,
       "currency_id": 1,
       "state": "draft",
       "display_type": "line_note",
       "name":  line 
   }
   return this.http.post( this.url + '/sale-line' , body )
 }

 
 updateLine(line_id: string, body: Object ) {
  return this.http.put(this.url + '/sale-line/' +  line_id,  body )
 }

 cancelDraft(id: string ) {
  const body = {
    "state": "cancel"
  }
  return this.http.put(this.url + '/sale/' +  id, body )
}

 acceptDraft(id: string ) {
  const body = {
    "state": "sent"
  }
  return this.http.put(this.url + '/sale/' +  id, body )
}

  endTask(id: string ) {
    const body = {
      "state": "sale"
    }
    return this.http.put(this.url + '/sale/' +  id, body )
  }

  partner(id: string) {
    return this.http.get(this.url + '/partner/' +  id)
  } 

  ordersDraft() {
    return this.http.get(this.url + '/sales-draft')
  }

  deleteLine( line_id: number) {
    return this.http.delete(this.url + '/sale-line/' +  line_id )
  }

  getLink(id: number ) {
    return this.http.get(this.url + '/sale-link/' + id )

  }

  subscribeTopic( token: string ) {
    return this.http.post(this.url + '/subscribe-push/all', { token })
  }
}