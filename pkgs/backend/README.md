# Backend Package

## Environment Variables

This backend application requires environment variables to be configured. Follow these steps:

### Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your values:
   - `JWT_SECRET`: Secret key for JWT signing (minimum 32 characters recommended)
   - `PORT`: Server port (default: 3001)

### Required Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token signing and verification | - | Yes |
| `PORT` | HTTP server port | 3001 | No |

### Security Notes

⚠️ **Important**:
- Never commit your `.env` file to version control
- Use a strong, randomly generated secret for `JWT_SECRET` in production
- The `.env.example` file is safe to commit as it contains no secrets

### Generating a Secure JWT_SECRET

You can generate a secure random secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```
