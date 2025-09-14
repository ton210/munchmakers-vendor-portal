# MunchMakers Vendor Portal

Enterprise-grade vendor self-service portal for MunchMakers.com that allows vendors to submit products for approval and listing on the main e-commerce platform.

## Features

### Vendor Features
- **Vendor Registration & Onboarding**: Multi-step registration with business verification
- **Product Management**: Upload, edit, and submit products for approval
- **Bulk Import**: CSV import for large product catalogs
- **Image Management**: Drag-and-drop image upload with R2 storage
- **Dashboard Analytics**: Product statistics and performance metrics
- **Multi-User Support**: Team management with role-based permissions
- **Document Management**: Upload business documents for verification

### Admin Features
- **Vendor Approval Workflow**: Review and approve vendor applications
- **Product Review System**: Comprehensive product approval process
- **Analytics Dashboard**: Real-time statistics and reporting
- **Activity Logging**: Complete audit trail of all actions
- **User Management**: Admin user roles and permissions
- **Bulk Operations**: Efficient batch processing of products

### Integration Features
- **BigCommerce Integration**: Automatic product sync to storefront
- **Cloudflare R2 Storage**: Scalable image and document storage
- **SendGrid Email**: Automated email notifications
- **Slack Notifications**: Real-time team alerts

## Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Knex.js migrations
- **Storage**: Cloudflare R2
- **Email**: SendGrid
- **Deployment**: Heroku
- **Authentication**: JWT-based with secure sessions

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Cloudflare R2 account
- SendGrid account
- BigCommerce API access

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/ton210/munchmakers-vendor-portal.git
cd vendor-portal
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with the required credentials:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vendor_portal

# JWT
JWT_SECRET=your_jwt_secret_here

# BigCommerce
BC_ACCESS_TOKEN=your_bigcommerce_access_token
BC_STORE_HASH=your_store_hash

# Cloudflare R2
R2_ACCESS_KEY=your_r2_access_key
R2_ACCESS_KEY_ID=your_r2_access_key_id
# ... (see .env.example for all R2 variables)

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=info@munchmakers.com

# Slack (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run migrate
```

3. Seed the database:
```bash
npm run seed
```

4. Start the development servers:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000` and the frontend at `http://localhost:3000`.

### Default Admin Credentials
- Email: `admin@munchmakers.com`
- Password: `Admin123!`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/vendor/register` - Vendor registration
- `POST /api/auth/vendor/login` - Vendor login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Product Endpoints
- `GET /api/products` - Get all products (admin) or vendor products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/submit` - Submit product for review
- `POST /api/products/:id/approve` - Approve product (admin)
- `POST /api/products/:id/reject` - Reject product (admin)

### Admin Endpoints
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/vendors` - Get all vendors
- `POST /api/admin/vendors/:id/approve` - Approve vendor
- `GET /api/admin/products/review-queue` - Product review queue
- `GET /api/admin/activity-logs` - Activity logs

### Upload Endpoints
- `POST /api/products/:id/images` - Upload product images
- `POST /api/products/import/csv` - Import products from CSV
- `POST /api/vendors/:id/documents` - Upload vendor documents

## Database Schema

The application uses PostgreSQL with the following main tables:
- `vendors` - Vendor company information
- `vendor_users` - Vendor user accounts
- `admin_users` - Admin user accounts
- `products` - Product catalog
- `product_images` - Product images
- `product_categories` - Product categorization
- `activity_logs` - Audit trail

See the `migrations/` directory for complete schema definitions.

## Deployment

### Heroku Deployment

1. Create a Heroku app:
```bash
heroku create munchmakers-vendor-portal
```

2. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:mini
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set BC_ACCESS_TOKEN=your_bc_token
# ... (set all required environment variables)
```

4. Deploy:
```bash
git push heroku main
```

The app will automatically run migrations on deploy via the `release` process in `Procfile`.

### Custom Domain Setup

1. Add custom domain to Heroku:
```bash
heroku domains:add vendor.munchmakers.com
```

2. Configure DNS to point to Heroku:
```
vendor.munchmakers.com CNAME munchmakers-vendor-portal.herokuapp.com
```

3. Enable SSL:
```bash
heroku certs:auto:enable
```

## Development

### Project Structure
```
vendor-portal/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── migrations/         # Database migrations
│   └── seeds/             # Database seeds
├── frontend/               # React frontend
│   └── src/
│       ├── components/     # React components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── hooks/         # Custom hooks
└── shared/                # Shared types and utilities
```

### Adding New Features

1. Create database migration if needed:
```bash
cd backend && npx knex migrate:make feature_name
```

2. Update models in `backend/src/models/`
3. Add controllers in `backend/src/controllers/`
4. Create routes in `backend/src/routes/`
5. Add frontend components in `frontend/src/`

### Testing

Run the test suite:
```bash
npm test
```

### Code Style

The project uses:
- ESLint for JavaScript linting
- Prettier for code formatting
- TypeScript for frontend type safety

## Security Features

- JWT-based authentication with secure session management
- Input sanitization and validation
- Rate limiting on all endpoints
- CSRF protection
- SQL injection prevention
- XSS protection with helmet.js
- File upload restrictions and validation
- Activity logging and audit trails

## Performance Optimization

- Database indexing strategy
- Redis caching for frequently accessed data
- Image optimization before R2 upload
- Lazy loading for large datasets
- Background job processing
- CDN integration for static assets

## Monitoring and Logging

- Comprehensive activity logging
- Error tracking with Slack notifications
- Performance monitoring
- Health check endpoints
- Database query logging in development

## Support

For technical support or feature requests, please:
1. Check the documentation
2. Review existing issues on GitHub
3. Contact the development team at tech@munchmakers.com

## License

Private software - All rights reserved by MunchMakers LLC.