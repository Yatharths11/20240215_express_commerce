// Imports
const { randomBytes } = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// App configuration
const app = express();
const port = 3000;

const rl = readline.Interface({
    input: process.stdin,
    output: process.stdout
});

// Middleware to parse JSON data
app.use(express.json());

// Middleware to parse URL-encoded data (for forms)
app.use(express.urlencoded({ extended: true }));

// Reading data from JSON files
let products;
try {
    const products_data = fs.readFileSync(path.join("products.json"), 'utf8');
    products = JSON.parse(products_data);
} catch (err) {
    console.error('Unable to fetch data.', err);
}

let orders;
try {
    const orders_data = fs.readFileSync(path.join("orders.json"), 'utf8');
    orders = JSON.parse(orders_data);
} catch (err) {
    console.error('Unable to fetch data.', err);
}

let buying_product;
let order_ids = [];
 
// Search API
// Query Parameter: q (search query)
app.get('/search', function (req, res) {
    let q = req.query.q;
    products.forEach(element => {
        if (element.product_name == q ) {
            res.send(element);
            buying_product = element;

        }
    });
    
});

// Checkout API
// Body Parameters: product_id, quantity
app.post('/checkout', (req, res) => {
    const orderData = req.body;

    products.forEach((element) => {
        if (element.product_id == orderData.product_id) {
            buying_product = element;
            element.stocks -= orderData.quantity;
        }
    });

    let order_id = Math.floor(Math.random() * 100) + 1;

    let order = {
        "order_id": order_id,
        "product_id": buying_product.product_id,
        "product_name": buying_product.product_name,
        "quantity": orderData.quantity,
    };

    orders.push(order);
    fs.writeFileSync('./orders.json', JSON.stringify(orders));

    let cost = orderData.quantity * buying_product.price;
    res.status(200).json({ message: 'Checkout successful', orderId: order_id, total_cost: cost });
});

// Cancel API
// Path Parameter: product_id
app.delete("/cancel/:product_id", (req, res) => {
    products.forEach((item) => {
        
        if (item.product_id == req.params.product_id) {
            if (item.status != "Delivered") {
                res.send("Your order is canceled successfully.");
            } else {
                res.send("Order already delivered, hence can't be canceled");
            }
        }
    });
    res.status(404).send("Product not found")
});

// Status API
// Path Parameter: product_id
app.get("/status/:product_id", (req, res) => {
    products.forEach((item) => {
        if (item.product_id == req.params.product_id) {
            res.send("The status of your order is : " + item.status);
        }
    });
});

// Add Products API
// Body Parameters: image_url, price, stock, rating, description
app.post("/products", (req, res) => {
    rl.question('Enter product name: ', (name) => {
        const newProd = {
            "product_id": Math.floor(Math.random() * 999) + 1,
            "Product_name": name,
            "image_url": req.body.image_url,
            "price": parseFloat(req.body.price),
            "stocks": parseInt(req.body.stocks),
            "rating": parseFloat(req.body.rating),
            "description": req.body.description
        };
        products.push(newProd);
        fs.writeFileSync('./products.json', JSON.stringify(products));
        res.send(`New Product added with ID ${newProd.product_id}`);
        
    });
});

// Update Products API
// Path Parameter: product_id
app.put("/products/:product_id", (req, res) => {
    let found = false;
    for (let i = 0; i < products.length; i++) {
        if (products[i].product_id === parseInt(req.params.product_id)) {
            found = true;
            // Update the data in that index
            products[i] = { ...products[i], ...req.body };
            break;
        }
    }
    if (!found) return res.send("No product with the given id was found!");
    else {
        fs.writeFileSync('./products.json', JSON.stringify(products));
        res.send("Product updated!");
    }
});

// Delete Product API
// Path Parameter: product_id
app.delete("/products/:product_id", (req, res) => {
    let prodId = parseInt(req.params.product_id);
    products = products.filter((prod) => prod.product_id !== prodId);
    fs.writeFileSync('./products.json', JSON.stringify(products));
    res.send("Product Deleted Successfully");
});

// Order API
// Body Parameters: product_name, quantity
app.post('/order', (req, res) => {
    console.log(req.body);
    console.log(`Your Order Details are :
    You have ordered ${req.body.product_name} and Quantity is ${req.body.quantity}`);
    // res.redirect('http://localhost:3000/checkout');
    res.send(`Your Order Details are :
    You have ordered ${req.body.product_name} and Quantity is ${req.body.quantity}`)
});

// View Product Details API
// Path Parameter: id
app.get('/product/:id', (req, res) => {
    products.forEach(element => {
        if (element.product_id == req.params.id) {
            res.send(element);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log("App Listening on port " + port);
});
