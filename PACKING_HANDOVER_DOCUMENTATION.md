# Packing and Handover Module Documentation

## Overview

The Packing and Handover Module is a comprehensive solution for managing warehouse packing operations and delivery handovers. It provides end-to-end tracking from completed picking waves through packing, verification, and handover to logistics partners.

## Architecture

### Core Components

1. **Packing Management**: Handles packing job creation, item verification, and workflow management
2. **Photo Evidence**: Captures and stores photo evidence with metadata
3. **Seal Management**: Generates and tracks cryptographically secure seal numbers
4. **Rider Management**: Manages delivery riders with availability and location tracking
5. **Handover Process**: Coordinates the transfer of packed items to delivery riders
6. **LMS Integration**: Syncs with Logistics Management Systems for shipment tracking

### Technology Stack

- **Backend**: Node.js with TypeScript
- **Database**: MySQL 8.0 with Sequelize ORM
- **File Storage**: AWS S3 for photo evidence
- **Real-time Updates**: WebSocket support (planned)
- **Queue Management**: Bull queue for background jobs
- **Authentication**: JWT with RBAC

## Database Schema

### Core Tables

#### 1. PackingJob
```sql
CREATE TABLE packing_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobNumber VARCHAR(50) UNIQUE NOT NULL,
  waveId INT NOT NULL,
  packerId INT,
  status ENUM('PENDING', 'PACKING', 'VERIFYING', 'COMPLETED', 'CANCELLED', 'AWAITING_HANDOVER'),
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  assignedAt DATETIME,
  startedAt DATETIME,
  completedAt DATETIME,
  handoverAt DATETIME,
  totalItems INT DEFAULT 0,
  packedItems INT DEFAULT 0,
  verifiedItems INT DEFAULT 0,
  estimatedDuration INT DEFAULT 30,
  slaDeadline DATETIME NOT NULL,
  workflowType ENUM('PICKER_PACKS', 'DEDICATED_PACKER'),
  specialInstructions TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. PackingItem
```sql
CREATE TABLE packing_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId INT NOT NULL,
  orderId INT NOT NULL,
  sku VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 0,
  pickedQuantity INT DEFAULT 0,
  packedQuantity INT DEFAULT 0,
  verifiedQuantity INT DEFAULT 0,
  status ENUM('PENDING', 'PACKING', 'VERIFIED', 'COMPLETED'),
  verificationNotes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. PhotoEvidence
```sql
CREATE TABLE photo_evidence (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId INT NOT NULL,
  orderId INT,
  photoType ENUM('PRE_PACK', 'POST_PACK', 'SEALED', 'HANDOVER'),
  photoUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  metadata JSON NOT NULL,
  verificationStatus ENUM('PENDING', 'VERIFIED', 'REJECTED'),
  verifiedBy INT,
  verifiedAt DATETIME,
  rejectionReason TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4. Seal
```sql
CREATE TABLE seals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sealNumber VARCHAR(100) UNIQUE NOT NULL,
  jobId INT NOT NULL,
  orderId INT,
  sealType ENUM('PLASTIC', 'PAPER', 'METAL', 'ELECTRONIC'),
  appliedAt DATETIME,
  appliedBy INT,
  verificationStatus ENUM('PENDING', 'VERIFIED', 'TAMPERED'),
  verifiedBy INT,
  verifiedAt DATETIME,
  tamperEvidence TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5. Rider
```sql
CREATE TABLE riders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  riderCode VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  vehicleType ENUM('BIKE', 'SCOOTER', 'CAR', 'VAN'),
  vehicleNumber VARCHAR(20),
  availabilityStatus ENUM('AVAILABLE', 'BUSY', 'OFFLINE', 'BREAK'),
  currentLocation JSON,
  rating DECIMAL(3,2) DEFAULT 5.00,
  totalDeliveries INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  lastActiveAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 6. Handover
```sql
CREATE TABLE handovers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId INT NOT NULL,
  riderId INT NOT NULL,
  status ENUM('ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'),
  assignedAt DATETIME NOT NULL,
  confirmedAt DATETIME,
  pickedUpAt DATETIME,
  deliveredAt DATETIME,
  cancellationReason TEXT,
  cancellationBy INT,
  lmsSyncStatus ENUM('PENDING', 'SYNCED', 'FAILED', 'RETRY'),
  lmsSyncAttempts INT DEFAULT 0,
  lmsLastSyncAt DATETIME,
  lmsErrorMessage TEXT,
  trackingNumber VARCHAR(100),
  manifestNumber VARCHAR(100),
  specialInstructions TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 7. LMSShipment
```sql
CREATE TABLE lms_shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  handoverId INT NOT NULL,
  lmsReference VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('PENDING', 'CREATED', 'MANIFESTED', 'IN_TRANSIT', 'DELIVERED'),
  lmsResponse JSON NOT NULL,
  retryCount INT DEFAULT 0,
  lastRetryAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 8. PackingEvent
```sql
CREATE TABLE packing_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId INT NOT NULL,
  eventType ENUM('PACKING_STARTED', 'ITEM_PACKED', 'ITEM_VERIFIED', 'PACKING_COMPLETED', 'HANDOVER_ASSIGNED', 'HANDOVER_CONFIRMED', 'LMS_SYNCED'),
  eventData JSON NOT NULL,
  userId INT,
  timestamp DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Packing Operations

#### Start Packing Job
```http
POST /api/packing/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "waveId": 123,
  "packerId": 456,
  "priority": "HIGH",
  "workflowType": "DEDICATED_PACKER",
  "specialInstructions": "Handle with care - fragile items"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "jobId": 789,
    "jobNumber": "PKG-abc123-def456",
    "message": "Packing job started successfully"
  }
}
```

#### Verify Item
```http
POST /api/packing/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "jobId": 789,
  "orderId": 101,
  "sku": "SKU123",
  "packedQuantity": 5,
  "verificationNotes": "All items verified and packed"
}
```

#### Complete Packing
```http
POST /api/packing/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "jobId": 789,
  "photos": [
    {
      "photoType": "POST_PACK",
      "photoUrl": "https://s3.amazonaws.com/bucket/photo1.jpg",
      "metadata": {
        "location": "Packing Station A",
        "device": "Mobile App"
      }
    }
  ],
  "seals": [
    {
      "sealNumber": "OZI-abc123-def456",
      "sealType": "PLASTIC",
      "orderId": 101
    }
  ]
}
```

#### Get Job Status
```http
GET /api/packing/status/789
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": 789,
    "jobNumber": "PKG-abc123-def456",
    "status": "PACKING",
    "progress": {
      "totalItems": 10,
      "packedItems": 7,
      "verifiedItems": 5,
      "percentage": 70
    },
    "sla": {
      "deadline": "2024-01-15T18:00:00Z",
      "remaining": 45,
      "status": "ON_TRACK"
    },
    "assignedPacker": {
      "id": 456,
      "name": "john.doe@example.com"
    }
  }
}
```

### Handover Operations

#### Assign Rider
```http
POST /api/handover/assign-rider
Content-Type: application/json
Authorization: Bearer <token>

{
  "jobId": 789,
  "riderId": 123,
  "specialInstructions": "Deliver before 6 PM"
}
```

#### Confirm Handover
```http
POST /api/handover/confirm
Content-Type: application/json
Authorization: Bearer <token>

{
  "handoverId": 456,
  "riderId": 123,
  "confirmationCode": "ABC123"
}
```

#### Update Handover Status
```http
PUT /api/handover/456/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "IN_TRANSIT",
  "additionalData": {
    "location": "40.7128,-74.0060",
    "estimatedDelivery": "2024-01-15T19:00:00Z"
  }
}
```

#### Retry LMS Sync
```http
POST /api/handover/456/resync-lms
Authorization: Bearer <token>
```

### Monitoring Endpoints

#### Get Jobs Awaiting Handover
```http
GET /api/packing/awaiting-handover
Authorization: Bearer <token>
```

#### Get SLA Status
```http
GET /api/packing/sla-status
Authorization: Bearer <token>
```

#### Get Available Riders
```http
GET /api/handover/riders/available
Authorization: Bearer <token>
```

#### Get LMS Sync Status
```http
GET /api/handover/lms/sync-status
Authorization: Bearer <token>
```

## Workflow States

### Packing Job States
1. **PENDING**: Job created, waiting for packer assignment
2. **PACKING**: Packer assigned, items being packed
3. **VERIFYING**: Items packed, undergoing verification
4. **COMPLETED**: All items packed and verified
5. **AWAITING_HANDOVER**: Ready for rider assignment
6. **CANCELLED**: Job cancelled due to issues

### Handover States
1. **ASSIGNED**: Rider assigned to job
2. **CONFIRMED**: Rider confirmed pickup
3. **IN_TRANSIT**: Items in delivery
4. **DELIVERED**: Items delivered to customer
5. **CANCELLED**: Handover cancelled

### LMS Sync States
1. **PENDING**: Waiting for LMS sync
2. **SYNCED**: Successfully synced with LMS
3. **FAILED**: LMS sync failed
4. **RETRY**: Retrying failed sync

## Security Features

### Seal Generation
- Cryptographically secure seal numbers
- Anti-tampering measures with hash verification
- Unique constraints and expiration handling
- Audit trail for all seal operations

### Photo Evidence
- Secure S3 storage with signed URLs
- Metadata validation and sanitization
- Access controls and audit logging
- Thumbnail generation for performance

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based endpoint access
- Request validation and sanitization

## Performance Optimizations

### Database Indexes
- Composite indexes for common query patterns
- Status-based indexes for filtering
- Time-based indexes for SLA tracking
- Foreign key indexes for joins

### Caching Strategy
- Redis caching for frequently accessed data
- Query result caching
- Session management
- Rate limiting for API endpoints

### Background Processing
- Bull queue for heavy operations
- Async photo processing
- Batch LMS sync operations
- Scheduled cleanup tasks

## Error Handling

### LMS Integration Failures
- Automatic retry with exponential backoff
- Queue management for failed operations
- Manual retry endpoints
- Comprehensive error logging

### Photo Upload Failures
- Retry mechanisms for S3 uploads
- Fallback storage options
- Error reporting and monitoring
- User notification for failures

### Database Constraints
- Foreign key validation
- Unique constraint handling
- Transaction rollback on errors
- Data integrity checks

## Monitoring & Alerting

### Key Metrics
- Packing time distribution
- Handover delay tracking
- LMS sync success rate
- SLA compliance percentage
- Photo upload success rate

### Alerting Rules
- Packing SLA breaches
- LMS sync failures
- Rider assignment delays
- Photo upload failures
- Database connection issues

### Dashboards
- Real-time packing status
- SLA compliance overview
- Rider performance metrics
- LMS integration health
- System performance metrics

## Deployment

### Environment Variables
```bash
# Database
DB_NAME=ozi_backend
DB_USER=root
DB_PASSWORD=password
DB_HOST=127.0.0.1
DB_PORT=3306

# S3 Configuration
S3_BUCKET=ozi-packing-photos
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key

# LMS Integration
LMS_BASE_URL=https://lms.example.com/api
LMS_API_KEY=your_lms_api_key
LMS_TIMEOUT=30000
LMS_RETRY_ATTEMPTS=3
LMS_RETRY_DELAY=1000

# Security
SEAL_SECRET=your_seal_secret_key
JWT_SECRET=your_jwt_secret

# Redis (for queues)
REDIS_URL=redis://localhost:6379
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ozi-packing-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ozi-packing-backend
  template:
    metadata:
      labels:
        app: ozi-packing-backend
    spec:
      containers:
      - name: ozi-packing-backend
        image: ozi-packing-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ozi-config
              key: db_host
```

## Testing

### Unit Tests
- Controller method testing
- Service layer testing
- Utility function testing
- Model validation testing

### Integration Tests
- API endpoint testing
- Database integration testing
- LMS integration testing
- S3 integration testing

### Performance Tests
- Load testing for packing operations
- Stress testing for photo uploads
- Database query performance testing
- API response time testing

## Future Enhancements

### Phase 2 Features
- Real-time WebSocket updates
- Advanced analytics dashboard
- Machine learning for SLA prediction
- Mobile app integration
- Advanced photo processing

### Phase 3 Features
- AI-powered quality control
- Predictive maintenance
- Advanced route optimization
- Customer notification system
- Integration with multiple LMS providers

## Support & Maintenance

### Troubleshooting
- Common error scenarios
- Debug logging configuration
- Performance tuning guidelines
- Database optimization tips

### Maintenance Tasks
- Regular database cleanup
- Log rotation and archiving
- Performance monitoring
- Security updates

### Contact Information
- Technical support: tech@ozi.com
- Documentation updates: docs@ozi.com
- Emergency support: emergency@ozi.com

---

*This documentation is maintained by the OZi Development Team. Last updated: January 2024*
