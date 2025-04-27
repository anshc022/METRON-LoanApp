require('dotenv').config();

exports.validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-KEY');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  // Validate against environment variable or database of valid keys
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};