// Middleware to parse FormData address fields into nested object
// This allows express-validator to work with FormData format

export const parseFormDataAddress = (req, res, next) => {
  // If address fields come as address[village], address[postOffice], etc.
  // Parse them into req.body.address object
  if (req.body['address[village]'] || req.body['address[postOffice]']) {
    req.body.address = {
      village: req.body['address[village]'] || req.body.address?.village,
      postOffice: req.body['address[postOffice]'] || req.body.address?.postOffice,
      policeStation: req.body['address[policeStation]'] || req.body.address?.policeStation,
      district: req.body['address[district]'] || req.body.address?.district,
      pinCode: req.body['address[pinCode]'] || req.body.address?.pinCode,
      landmark: req.body['address[landmark]'] || req.body.address?.landmark || ''
    };
    
    // Clean up the bracket notation fields
    delete req.body['address[village]'];
    delete req.body['address[postOffice]'];
    delete req.body['address[policeStation]'];
    delete req.body['address[district]'];
    delete req.body['address[pinCode]'];
    delete req.body['address[landmark]'];
  }
  
  next();
};


