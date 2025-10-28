/**
 * Error Handler Middleware
 * Handles all types of errors in the application
 */

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: "❌ Route not found",
    path: req.originalUrl,
  });
};

// Add identifier property for identification
notFoundHandler._middlewareName = 'notFoundHandler';

/**
 * Global Error Handler
 * Handles all types of errors in the application
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error("🔥 Server Error:", err);

  // Default error response
  let statusCode = 500;
  let errorMessage = "Internal Server Error";

  // Handle different types of errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorMessage = "Validation Error";
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorMessage = "Invalid ID format";
  } else if (err.name === "MongoError" && err.code === 11000) {
    statusCode = 409;
    errorMessage = "Duplicate entry";
  } else if (err.name === "MongoError") {
    statusCode = 500;
    errorMessage = "Database Error";
  } else if (err.code === "ENOENT") {
    statusCode = 500;
    errorMessage = "File System Error";
  } else if (err.code === "ECONNREFUSED") {
    statusCode = 500;
    errorMessage = "Connection Error";
  } else if (err.code === "ETIMEDOUT") {
    statusCode = 500;
    errorMessage = "Request Timeout";
  } else if (err.name === "SyntaxError") {
    statusCode = 400;
    errorMessage = "Invalid JSON format";
  } else if (err.name === "TypeError") {
    statusCode = 500;
    errorMessage = "Type Error";
  } else if (err.name === "ReferenceError") {
    statusCode = 500;
    errorMessage = "Reference Error";
  } else if (err.name === "RangeError") {
    statusCode = 500;
    errorMessage = "Range Error";
  }

  // Handle null, undefined, string, object, or array errors
  if (err === null || err === undefined) {
    statusCode = 500;
    errorMessage = "Unknown Error";
  } else if (typeof err === "string") {
    statusCode = 500;
    errorMessage = "String Error";
  } else if (Array.isArray(err)) {
    statusCode = 500;
    errorMessage = "Array Error";
  } else if (typeof err === "object" && !err.message) {
    statusCode = 500;
    errorMessage = "Object Error";
  }

  // Send error response
  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === "development" && { 
      stack: err.stack,
      details: err.message 
    })
  });
};

// Add identifier property for identification
errorHandler._middlewareName = 'errorHandler';

export default { notFoundHandler, errorHandler };
