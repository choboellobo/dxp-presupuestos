import { Injectable } from '@angular/core';
import { addDoc, doc, collection, Firestore, getDocs, query, where, updateDoc, deleteDoc, collectionData, collectionChanges, onSnapshot, orderBy } from '@angular/fire/firestore';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(
    private db: Firestore
  ) { }

  async  requestFilesystemPermissions() {
    try {
      // Solicitar permisos al usuario
      const result = await Filesystem.requestPermissions();
  
      // Verificar el estado del permiso
      if (result.publicStorage === 'granted') {
        console.log('Permisos concedidos para el almacenamiento público.');
        return true;
      } else {
        console.error('Permisos denegados para el almacenamiento público.');
        return false;
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      return false;
    }
  }

  async nativeExportToCsv(data: any[], filename: string = 'data.csv') {
    const hasPermissions = await this.requestFilesystemPermissions();
  if (hasPermissions) {
    console.log('Puedes proceder con operaciones en el sistema de archivos.');
  } else {
   return alert('No tienes permisos para acceder al sistema de archivos.');
  }
    if (!data || !data.length) {
      console.error('No data provided');
      return;
    }
  
    try {
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
  
      // Crear el string CSV
      const csvString = csvRows.join('\n');
  
      // Guardar el archivo usando el plugin Filesystem
      await Filesystem.writeFile({
        path: filename,
        data: csvString,
        directory: Directory.Documents, // Guarda el archivo en la carpeta Documentos
        encoding: Encoding.UTF8,
      });
  
      console.log('Archivo CSV exportado correctamente:', filename);
      try {
        const fileUri = await Filesystem.getUri({
          directory: Directory.Documents,
          path: filename,
        });
    
        await Share.share({
          title: 'Compartir CSV',
          text: 'Aquí está tu archivo CSV.',
          url: fileUri.uri,
          dialogTitle: 'Compartir archivo',
        });
      } catch (error) {
        console.error('Error al compartir archivo:', error);
      }


    } catch (error) {
      console.error('Error al exportar CSV:', error);
    }
  }

  async createProduct(product: any) {
    const productsRef = collection(this.db, "products");
    return await addDoc(productsRef, product);
  }
  async updateProduct(product: any) {
    const productRef = doc(this.db, "products", product.product_id);
    return await updateDoc(productRef, product);
  }

  async deleteProduct(product_id: string) {
    const productRef = doc(this.db, "products", product_id);
    return await deleteDoc(productRef);
  }

  async getCarts() {
    const cartsRef = collection(this.db, "carts");
    const q = query( cartsRef, where("active", "==", false), orderBy("date", "desc"));
    return await getDocs(q);
  }

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

  async addProductToCart( cart_id: string, product: any, quantity: number = 1 ) {
    const _product = {
      product_id: product.product_id,
      sku: product.sku,
      name: product.name,
      cost: product.cost,
      quantity
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



  exportToCsv(data: any[], filename: string = 'data.csv'): void {
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
    a.target = '_system';
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    window.URL.revokeObjectURL(url);
    a.remove();
  };
}
