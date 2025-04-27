const formatResponse = (req, res, next) => {
  // Store original res.json
  const originalJson = res.json;

  // Override res.json to standardize response format
  res.json = function(data) {
    // If data already has success field, return as is
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }

    // Otherwise wrap in standard format
    return originalJson.call(this, {
      success: this.statusCode >= 200 && this.statusCode < 300,
      data: data,
      message: data.message || ''
    });
  };

  next();
};

module.exports = formatResponse;