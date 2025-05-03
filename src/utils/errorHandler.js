export class ErrorHandler {
  static handleServiceError(error, data, context = 'SERVICE') {
    console.error(`[${context} ERROR] Operation failed: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        data
      }
    });
    
    const errorHandlers = {
      SequelizeUniqueConstraintError: () => {
        const field = error.errors?.[0]?.path || 'unknown field';
        return {
          success: false,
          statusCode: 400,
          data: { 
            error: `Duplicate entry: ${field} already exists`,
            field,
            code: 'DUPLICATE_ENTRY'
          }
        };
      },
      
      SequelizeValidationError: () => ({
        success: false,
        statusCode: 400,
        data: { 
          error: 'Validation error', 
          details: error.errors.map(err => ({ field: err.path, message: err.message })),
          code: 'VALIDATION_ERROR'
        }
      }),
      
      default: () => ({
        success: false,
        statusCode: 500,
        data: { 
          error: 'Server error', 
          message: error.message,
          code: 'SERVER_ERROR'
        }
      })
    };
    
    const handler = errorHandlers[error.name] || errorHandlers.default;
    return handler();
  }
}
