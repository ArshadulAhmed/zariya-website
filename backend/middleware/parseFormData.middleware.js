// Middleware to parse FormData address fields into nested object
// This allows express-validator to work with FormData format

export const parseFormDataAddress = (req, res, next) => {
  // Ensure req.body exists (multer should populate it)
  if (!req.body) {
    req.body = {};
  }

  // Debug: Log what we receive
  console.log('parseFormDataAddress - req.body keys:', Object.keys(req.body));
  console.log('parseFormDataAddress - req.body sample:', {
    fullName: req.body.fullName,
    age: req.body.age,
    'address[village]': req.body['address[village]']
  });

  // If req.body is completely empty, this is a problem
  if (Object.keys(req.body).length === 0 && !req.files) {
    console.error('⚠️  ERROR: req.body is empty and no files found!');
    console.error('   Content-Type:', req.headers['content-type']);
    console.error('   This might indicate FormData was not parsed correctly by multer');
  }

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
  
  // Ensure all fields are properly set (multer should populate req.body, but let's be safe)
  // Convert empty strings to undefined for validation
  Object.keys(req.body).forEach(key => {
    if (req.body[key] === '') {
      delete req.body[key];
    }
  });
  
  console.log('parseFormDataAddress - After parsing, req.body keys:', Object.keys(req.body));
  console.log('parseFormDataAddress - After parsing, address:', req.body.address);
  
  next();
};


