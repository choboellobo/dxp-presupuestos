import { Injectable } from '@angular/core';
import { addDoc, doc, collection, Firestore, getDocs, query, where, updateDoc, deleteDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(
    private db: Firestore
  ) { }

  async getCurrentCart() {
    const cartsRef = collection(this.db, "carts");
    const q = query(cartsRef, where("active", "==",  true )); 
    return await getDocs(q);
  }
  async getProductsCart( id: string ){
    const collectionRef = collection(this.db, 'carts', id, 'products');
    return await getDocs(collectionRef);
  }

  async updateQuantityProductCart( cart_id: string, product_id: string, quantity: number ) {
    const productRef = doc(this.db, "carts", cart_id, "products", product_id);
    return await updateDoc(productRef, {quantity});
  }

  async deleteProductCart( cart_id: string, product_id: string ) {
    const productRef = doc(this.db, "carts", cart_id, "products", product_id);
    return await deleteDoc(productRef);
  }

  async getProductByCode( code: string) {
    const productsCollection = collection(this.db, 'products');
    const q = query(productsCollection, where("code", "==", code));
    const docs = await  getDocs(q);
    return docs;
  }
  async setCartNotActive( cart_id: string ) {
    const cartRef = doc(this.db, 'carts', cart_id);
    return await updateDoc(cartRef, {active: false, date: new Date().toISOString() });
  }
  async createCart() {
    const cart = {
      active: true
    }
    const docRef = await addDoc( collection(this.db, 'carts'), cart);
    return docRef.id;
  }

  async addProductToCart( cart_id: string, product: any ) {
    const _product = {
      product_id: product.product_id,
      sku: product.sku,
      name: product.name,
      cost: product.cost,
      quantity: 1
    }
    return await addDoc( collection(this.db, 'carts', cart_id, 'products'), _product);
  }

  async addProduct() {
    const product = {
      name: 'Product 1',
      price: 100,
      cost: 50,
      sku: 'sdfsdfs',
      code: '123456',
      notes: 'This is a test product'
    }
    const docRef = await addDoc( collection(this.db, 'products'), product);
    return docRef.id
  }
}
