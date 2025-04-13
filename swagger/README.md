# Swagger Documentation for Online Groceries Shop API

This directory contains the Swagger configuration for the Online Groceries Shop API.

## Structure

- `swagger.js`: Main configuration file for Swagger setup
- `components.js`: Reusable Swagger components (schemas, responses, parameters)

## How to Use

The Swagger UI is accessible at `/api-docs` endpoint when the server is running.

## Adding Documentation to Endpoints

To document an API endpoint, add JSDoc comments above the route definition. 

Example:

```javascript
/**
 * @swagger
 * /api/path:
 *   get:
 *     summary: Brief summary
 *     description: Detailed description
 *     tags: [Category]
 *     parameters:
 *       - name: param
 *         in: query
 *         description: Parameter description
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
app.get('/api/path', (req, res) => {
  // Implementation
});
```

## Common Components

The following reusable components are defined in `components.js`:

### Schemas
- `Error`: Standard error response
- `User`: User information
- `Product`: Product details
- `Category`: Category information
- `Order`: Order details

### Responses
- `UnauthorizedError`: 401 Unauthorized response
- `BadRequest`: 400 Bad Request response
- `NotFound`: 404 Not Found response

### Parameters
- `IdParam`: Common ID parameter for path

## Adding New Components

To add new reusable components, extend the `components.js` file following the same pattern.

## Authentication

The API uses Bearer token authentication. Include the Authorization header with the JWT token:

```
Authorization: Bearer your-token-here
```

## Swagger UI Features

- Interactive documentation
- Try-it-out functionality to test endpoints
- Schema models
- Request/response examples 