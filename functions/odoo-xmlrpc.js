var Odoo = require('odoo-xmlrpc');

module.exports = {
    generateShareLink: function( id ) {
        var odoo = new Odoo({
            url: 'https://dxp-urban-mobility-sc.odoo.com',
            db: 'dxp-urban-mobility-sc',
             username: 'info@tupatinetedxp.es',
            password: 'tupatinetedxp47002'
        })

        return new Promise((resolve, reject ) => {
            odoo.connect(function (err) {
                if (err) { return console.log(err); }
                console.log('Connected to Odoo server.');   

                const params = {
                    res_model: 'sale.order',  // El modelo que deseas compartir
                    res_id: id,             // El ID de la orden de venta que deseas compartir
                    partner_ids: [],          // Los socios a los que compartir (si es necesario)
                    note: 'Compartiendo orden de venta', // Alguna nota opcional
                    access_warning: '',       // Advertencias de acceso, si las hay
                    share_link: ''            // Esto será generado por Odoo
                  };
            
                odoo.execute_kw('portal.share', 'create', [[params]], function (err, shareId) {
                    if (err) {
                        return console.log('Error al crear el enlace compartido:', err);
                      }
                
                      console.log('Enlace compartido creado con ID:', shareId);
                
                      // Obtener los detalles del portal.share creado, para extraer el share_link
                      odoo.execute_kw('portal.share', 'read', [
                        [shareId],  // Lista de IDs
                        { fields: ['share_link'] } // Diccionario con los campos que deseas leer
                      ], (err, shareDetails) => {
                        if (err) {
                          reject( err );
                          return console.log('Error al leer el enlace compartido:', err);
                        }
                        console.log( shareDetails)
                        return resolve( shareDetails )
                      
                        // Aquí tienes el enlace generado con access_token para la orden
                      });
                });
               
            
            });
        }) 

    }
}