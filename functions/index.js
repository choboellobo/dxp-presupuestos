const functions = require("firebase-functions");
const express = require('express');
const app = express();
const cors = require('cors');
const Odoo = require('node-odoo');
const bodyParser = require("body-parser")

const { generateShareLink } = require('./odoo-xmlrpc.js')

app.use( cors() );
app.use( bodyParser.json() )
const odoo = new Odoo({
    host: 'dxp-urban-mobility-sc.odoo.com',
    database: 'dxp-urban-mobility-sc',
    username: 'info@tupatinetedxp.es',
    password: 'tupatinetedxp47002'
  });

const getSaleLines = (line) => {
    return new Promise( (resolve, reject) => {
        console.log(line)
        odoo.get('sale.order.line', parseInt(line), (err, data) => {
            if(err) return reject(err);
            resolve(data[0]);
        })
    })
}  

const getSale = (id) => {
    return new Promise( (resolve, reject) => {
        odoo.connect( (err) => {
            if( err ) return res.status(500).json(err);
            odoo.get('sale.order', parseInt(id), (err, data) => {
                if( err ) return reject(err)
                resolve(data[0])
            })
        })
    }) 
}


app.get('/sale-link/:id', (req, res) => {
    const id = req.params.id;
    if( id ) {
        generateShareLink( id ).then( data => res.json(data)).catch( err => res.status(500).json(err))
    }else return res.status(404).send('Sale not found')
});

app.get('/sale/:sale', (req, res) =>  {
    const sale = req.params.sale;
    if(sale) {
        odoo.connect( (err) => {
            if( err ) return res.status(500).json(err);
            odoo.get('sale.order', parseInt(sale),  async(err, data) =>  {
                if (err) return res.status(500).json(err);
                console.log(data.order_line)
                const linesPromises = data[0].order_line.map( line_id => getSaleLines(line_id))
                const linesData = await Promise.all(linesPromises);
                return res.json({...data[0], order_line: linesData   })
              });
        })
    }else return res.status(404).send('Sale not found')
});

app.post('/sale-line', (req, res) => {
    odoo.connect( (err) => {
        if( err ) return res.status(500).json(err);
        odoo.create('sale.order.line', req.body, (err, data) => {
            if( err ) return res.status(500).json(err);
            res.json(data)
        })
    })
})
app.delete('/sale-line/:id', (req, res) => {

    odoo.connect( (err) => {
        if( err ) return res.status(500).json(err);
        odoo.delete('sale.order.line', parseInt(req.params.id), (err, data) => {
            if( err ) return res.status(500).json(err);
            res.json(data)
        })
    })
})

app.put('/sale-line/:id', (req, res) => {
    odoo.connect( (err) => {
        if( err ) return res.status(500).json(err);
        odoo.update('sale.order.line', parseInt(req.params.id), req.body, (err, data) => {
            if( err ) return res.status(500).json(err);
            res.json(data)
        })
    })
})


app.put('/sale/:sale', (req, res) => {
    const sale = req.params.sale;
    if(sale) {
        odoo.connect( (err) => {
            if( err ) return res.status(500).json(err);
            odoo.update('sale.order', parseInt(sale), req.body, (err, data) => {
                if( err ) return res.status(500).json(err);
                res.json(data)
            })
        })
    }
})

app.get('/partner/:id', (req, res) => {
    const id = req.params.id;
    if( id ) {
        odoo.connect( (err) => {
            if( err ) return res.status(500).json(err);
            odoo.get('res.partner', parseInt(id) , (err, data) => {
                 if (err) return res.status(500).json(err);
                 res.json(data)
            })
        })

    }else return res.status(404).send('Partner not found')
})


app.get('/sales-draft', (req, res) => {

    odoo.connect( (err) => {
        if( err ) return res.status(500).json(err);
        odoo.search('sale.order', [
            ['state', '!=', 'sale']
        ] , (err, data) => {
             if (err) return res.status(500).json(err);
             const promises = Promise.all( data.map( id => getSale(id)))
             promises.then( data => res.json(data))
        })
    })
})



exports.app = functions.region('europe-west3').https.onRequest(app);


