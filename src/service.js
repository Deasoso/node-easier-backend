const { ServiceBroker } = require("moleculer");
const HTTPServer = require("moleculer-web");

// Create broker
const broker = new ServiceBroker();

// Load service
broker.loadService("./src/math");

// Create the "gateway" service
broker.createService({
    // Define service name
    name: "gateway",
    // Load the HTTP server
    mixins: [HTTPServer],
  
    settings: {
      routes: [
        {
          aliases: {
            // When the "GET /products" request is made the "listProducts" action of "products" service is executed
            "GET /products": "math.products"
          }
        }
      ]
    }
  });

// Start broker
broker.start();