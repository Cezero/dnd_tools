# Error Handling Patterns

*Comprehensive documentation of error handling strategies, patterns, and best practices used across the D&D Tools application.*

## 📋 **Overview**

The D&D Tools application uses a centralized error handling approach that ensures consistent error responses, proper error classification, and comprehensive error logging. This document describes the error handling patterns, error types, and best practices used throughout the application.

## 🏗️ **Error Handling Architecture**

### **Centralized Error Middleware**

**Error Middleware** (`errorMiddleware.ts`):
- **Purpose**: Centralized error handling for all application errors
- **Location**: `apps/backend/src/middleware/errorMiddleware.ts`
- **Pattern**: Single error handler catches all errors and formats consistent responses

**Architecture Decision**: Centralized error handling ensures:
- **Consistency**: All errors follow same response format
- **Security**: Generic error messages prevent information leakage
- **Logging**: All errors logged server-side for debugging
- **Classification**: Errors classified by type for appropriate status codes

### **Error Classification**

Errors are classified into categories for appropriate handling:

**Validation Errors**:
- **Zod Schema Validation**: Input validation failures
- **Business Logic Validation**: Domain-specific rule violations
- **Database Constraint Errors**: Foreign key, unique constraint violations
- **Status Code**: 400 Bad Request

**Authentication Errors**:
- **Missing Token**: No authentication token provided
- **Invalid Token**: Token verification failed
- **Expired Token**: Token has expired
- **Status Code**: 401 Unauthorized

**Authorization Errors**:
- **Insufficient Permissions**: User lacks required permissions
- **Admin Required**: Operation requires admin access
- **Status Code**: 403 Forbidden

**Not Found Errors**:
- **Resource Not Found**: Requested resource doesn't exist
- **Prisma P2025**: Record not found in database
- **Status Code**: 404 Not Found

**Conflict Errors**:
- **Duplicate Resource**: Resource with same unique field exists
- **Prisma P2002**: Unique constraint violation
- **Status Code**: 409 Conflict

**System Errors**:
- **Database Errors**: Database connection or query errors
- **Unexpected Errors**: Unhandled exceptions
- **Status Code**: 500 Internal Server Error

## 🔧 **Error Handling Patterns**

### **Custom Error Classes**

**BaseError**:
- **Purpose**: Base class for all custom application errors
- **Properties**: `status` (HTTP status code), `message` (error message)
- **Usage**: Extended by specific error types

**UnauthorizedError**:
- **Purpose**: Authentication failures
- **Status Code**: 401
- **Usage**: Missing or invalid authentication

**ForbiddenError**:
- **Purpose**: Authorization failures
- **Status Code**: 403
- **Usage**: Insufficient permissions

**NotFoundError**:
- **Purpose**: Resource not found
- **Status Code**: 404
- **Usage**: Requested resource doesn't exist

**ValidationError**:
- **Purpose**: Validation failures
- **Status Code**: 400
- **Usage**: Input validation errors

### **Error Response Format**

**Standard Error Response**:
```typescript
{
    success: false,
    error: "Error message description"
}
```

**Validation Error Response**:
```typescript
{
    success: false,
    error: [
        {
            path: ["fieldName"],
            message: "Validation error message",
            code: "invalid_type"
        }
    ]
}
```

**Prisma Error Mapping**:
- **P2002**: Unique constraint violation → 409 Conflict
- **P2025**: Record not found → 404 Not Found
- **P2003**: Foreign key constraint → 400 Bad Request
- **Default**: Database operation failed → 500 Internal Server Error

## 🎯 **Error Handling Strategies**

### **Client Communication**

**Appropriate Status Codes**:
- Use correct HTTP status codes for error types
- 400 for validation errors
- 401 for authentication errors
- 403 for authorization errors
- 404 for not found errors
- 409 for conflict errors
- 500 for system errors

**Clear Error Messages**:
- Provide actionable error messages
- Avoid technical jargon in user-facing messages
- Include field-specific errors for validation failures

**Error Details**:
- Include relevant error details for debugging (server-side only)
- Generic messages for clients to prevent information leakage
- Log full error details server-side

**Consistent Format**:
- Use consistent error response format across all endpoints
- Standard structure for all error types
- Predictable error handling for clients

### **Server-Side Handling**

**Error Logging**:
- Log all errors with full context
- Include stack traces for debugging
- Log error metadata (user ID, request path, timestamp)
- Use appropriate log levels (error, warn, info)

**Error Monitoring**:
- Monitor error rates and patterns
- Track error types and frequencies
- Alert on error spikes or critical errors
- Analyze error trends for improvements

**Error Recovery**:
- Implement error recovery strategies where possible
- Graceful degradation for non-critical errors
- Retry logic for transient errors
- Fallback mechanisms for service failures

**Error Prevention**:
- Comprehensive input validation
- Type safety through TypeScript
- Schema validation with Zod
- Business rule validation
- Database constraint enforcement

## 🔗 **Error Handling in Different Layers**

### **Route Layer**

**Validation Errors**:
- Zod schema validation catches invalid input
- Validation errors passed to error middleware
- Type-safe request objects prevent type errors

**Authentication Errors**:
- Authentication middleware throws UnauthorizedError
- Error middleware catches and formats response

### **Controller Layer**

**Service Errors**:
- Controllers catch service errors
- Errors passed to error middleware
- Appropriate status codes set

**Not Found Errors**:
- Controllers check for null results
- Throw NotFoundError or return 404
- Error middleware formats response

### **Service Layer**

**Business Logic Errors**:
- Services validate business rules
- Throw appropriate error types
- Errors propagate to controllers

**Database Errors**:
- Prisma errors caught and mapped
- Custom errors thrown for business logic
- Transaction rollback on errors

### **Database Layer**

**Constraint Errors**:
- Foreign key violations
- Unique constraint violations
- Prisma maps to appropriate error codes

**Connection Errors**:
- Database connection failures
- Query timeout errors
- Handled by Prisma and error middleware

## 📊 **Error Handling Best Practices**

### **Input Validation**

- **Validate Early**: Validate input at route/controller layer
- **Comprehensive Validation**: Validate all inputs with Zod schemas
- **Type Safety**: Use TypeScript for compile-time type checking
- **Business Rules**: Validate business rules in service layer

### **Error Messages**

- **User-Friendly**: Provide clear, actionable error messages
- **Specific**: Include field-specific errors for validation
- **Secure**: Don't leak sensitive information in error messages
- **Consistent**: Use consistent error message format

### **Error Logging**

- **Comprehensive**: Log all errors with full context
- **Structured**: Use structured logging for better analysis
- **Metadata**: Include request metadata (user, path, timestamp)
- **Stack Traces**: Include stack traces for debugging

### **Error Recovery**

- **Graceful Degradation**: Handle errors gracefully when possible
- **Retry Logic**: Implement retry for transient errors
- **Fallbacks**: Provide fallback mechanisms for service failures
- **User Experience**: Maintain good UX even when errors occur

## 📚 **Related Documentation**

- **[Backend Implementation Patterns](backend-implementation.md)** - Backend error handling patterns
- **[Middleware Documentation](backend-implementation.md#middleware-patterns)** - Error middleware details

## Summary

Error handling in the D&D Tools application follows a centralized approach that ensures consistency, security, and maintainability. The error middleware provides a single point for error handling, while custom error classes and proper error classification ensure appropriate responses.

Key principles:
- **Centralized Handling**: Single error middleware for all errors
- **Error Classification**: Errors classified by type for appropriate handling
- **Security**: Generic error messages prevent information leakage
- **Logging**: Comprehensive error logging for debugging
- **Consistency**: Consistent error response format across all endpoints

The error handling architecture supports reliable error management while maintaining security and providing good user experience.
