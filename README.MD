# Administrative Boundaries API

**API hệ thống ranh giới hành chính Việt Nam** - Cung cấp dữ liệu tỉnh/thành phố, quận/huyện, phường/xã với khả năng CRUD và đồng bộ tự động.

## 📋 Tổng quan dự án

Dự án này xây dựng một **API RESTful** để quản lý dữ liệu hành chính Việt Nam, bao gồm:
- **34 tỉnh/thành phố**
- **Hàng nghìn quận/huyện** 
- **Hàng chục nghìn phường/xã**

Với khả năng tìm kiếm, chuyển đổi địa chỉ, quản lý lịch sử và đồng bộ tự động.

##  Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External API  │    │   Express API   │    │    MongoDB      │
│  (address-kit)  │───▶│    Server       │───▶│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   JSON Backup   │
                       │  (fallback)     │
                       └─────────────────┘
```

##  Luồng hoạt động chính

### **1. Khởi động hệ thống**
```bash
# Cài đặt dependencies
npm install

# Khởi động MongoDB (Windows)
net start MongoDB

# Chạy server
npm run start
```

### **2. Fetch dữ liệu từ API**
```bash
# Lấy dữ liệu mới nhất từ address-kit API
npm run fetch
```

### **3. Import vào MongoDB**
```bash
# Import dữ liệu vào database
npm run import-units
```

### **4. Chạy cron job tự động**
```bash
# Tự động cập nhật dữ liệu hàng ngày lúc 3:00 AM
npm run schedule
```

## 📋 NPM Scripts & Commands

### **Development Commands**
```bash
npm start                    # Khởi động server (production mode)
npm run dev                  # Khởi động server (development mode)
npm run build                # Build project (nếu có)
```

### **Data Management Commands**
```bash
npm run fetch                # Fetch data từ external API
npm run import-units         # Import units vào MongoDB
npm run import-address       # Import addresses vào MongoDB
npm run schedule             # Chạy cron job scheduler
```

### **🧪 Testing Commands**
```bash
npm test                     # Chạy tất cả tests
npm run test:coverage        # Chạy tests với coverage report
npm run test:watch           # Chạy tests ở watch mode
npm run test:performance     # Chạy performance tests
npm run test:integration     # Chạy integration tests
npm run test:server          # Chạy server API tests
npm run test:middleware      # Chạy middleware tests
npm run test:utils           # Chạy utility tests
npm run test:scripts         # Chạy script tests
npm run test:fetcher         # Chạy fetcher tests
```

### **🔧 Utility Commands**
```bash
npm run lint                 # Lint code (nếu có)
npm run format               # Format code (nếu có)
npm run clean                # Clean build artifacts
npm run validate             # Validate project setup
```

### **📊 Monitoring Commands**
```bash
npm run logs                 # Xem logs (nếu có)
npm run status               # Kiểm tra trạng thái system
npm run health               # Health check
```

### **🗄️ Database Commands**
```bash
npm run db:connect           # Kết nối database
npm run db:disconnect        # Ngắt kết nối database
npm run db:seed              # Seed database với test data
npm run db:reset             # Reset database
npm run db:backup            # Backup database
```

### **📁 File Operations Commands**
```bash
npm run data:fetch           # Fetch data từ API
npm run data:import          # Import data vào database
npm run data:export          # Export data từ database
npm run data:clean           # Clean data files
```

### **🔍 Debug Commands**
```bash
npm run debug                # Chạy với debug mode
npm run debug:server         # Debug server
npm run debug:test           # Debug tests
npm run debug:performance    # Debug performance tests
```

## 📁 Cấu trúc dự án chi tiết

### 🏗️ **Root Level Files**
```
AdministrativeBoundaries/
├── 📄 server.js                   # 🚀 Main server entry point
│   └── Khởi động Express server, kết nối MongoDB, mount routes
├── 📄 package.json                # 📦 Dependencies & npm scripts
├── 📄 jest.config.js              # ⚙️ Jest testing configuration
├── 📄 jest.global-setup.js        # 🔧 Jest global setup (MongoDB connection)
├── 📄 jest.global-teardown.js     # 🧹 Jest global teardown (cleanup)
├── 📄 jest.setup.js               # 🛠️ Jest test setup utilities
└── 📄 README.MD                   # 📚 Project documentation
```

### 🖥️ **Server Core** (`/server/`)
```
📁 server/
├── 📄 index.js                    # 🎯 Server configuration & startup
│   └── Express app setup, middleware, route mounting
│
├── 📁 controllers/                # 🎮 Business Logic Layer
│   ├── 📄 provinceController.js   # 🏛️ Xử lý tỉnh/thành phố
│   │   └── GET /provinces, tìm kiếm, lọc dữ liệu
│   ├── 📄 communeController.js    # 🏘️ Xử lý xã/phường
│   │   └── GET /communes, lọc theo tỉnh, tìm kiếm
│   ├── 📄 unitController.js       # 🔧 CRUD đơn vị hành chính
│   │   └── POST/PUT/DELETE/GET units, history tracking
│   ├── 📄 convertController.js    # 🔄 Chuyển đổi địa chỉ
│   │   └── POST /convert, parse address string
│   ├── 📄 searchController.js     # 🔍 Tìm kiếm toàn diện
│   │   └── GET /search, multi-field search
│   └── 📄 treeController.js       # 🌳 Cây phân cấp hành chính
│       └── GET /tree, hierarchical data structure
│
├── 📁 models/                     # 🗄️ Database Schemas
│   ├── 📄 Unit.js                 # 📋 Schema đơn vị hành chính
│   │   └── name, code, level, parentCode, timestamps
│   ├── 📄 UnitHistory.js          # 📜 Schema lịch sử thay đổi
│   │   └── action, oldData, newData, changedAt
│   └── 📄 Address.js              # 🏠 Schema địa chỉ (legacy)
│       └── address parsing và validation
│
├── 📁 routes/                     # 🛣️ API Endpoints
│   ├── 📄 provinces.js            # 🏛️ /provinces endpoints
│   │   └── GET /provinces, routing to provinceController
│   ├── 📄 communes.js             # 🏘️ /communes endpoints
│   │   └── GET /communes, GET /communes/:provinceID
│   ├── 📄 units.js                # 🔧 /units CRUD endpoints
│   │   └── GET/POST/PUT/DELETE /units/:code, history, restore
│   ├── 📄 convert.js              # 🔄 /convert endpoints
│   │   └── POST /convert, address conversion
│   ├── 📄 search.js               # 🔍 /search endpoints
│   │   └── GET /search, multi-parameter search
│   └── 📄 tree.js                 # 🌳 /tree endpoints
│       └── GET /tree, hierarchical structure
│
├── 📁 middleware/                 # 🔧 Middleware Functions
│   ├── 📄 validateUnit.js         # ✅ Input validation
│   │   └── Validate unit data, required fields, data types
│   ├── 📄 errorHandler.js         # ❌ Error handling
│   │   └── Global error handler, 404 handler, error formatting
│   └── 📄 cacheMiddleware.js      # ⚡ Cache layer
│       └── Response caching, cache invalidation
│
├── 📁 utils/                      # 🛠️ Utility Functions
│   ├── 📄 db.js                   # 🗄️ MongoDB connection
│   │   └── Connect/disconnect, connection status
│   ├── 📄 finder.js               # 🔍 JSON search utilities
│   │   └── Search functions for JSON data
│   ├── 📄 loader.js               # 📥 Data loading utilities
│   │   └── Load data from files, parse JSON
│   └── 📄 response.js             # 📤 Response formatting
│       └── Standardize API responses, error formatting
│
└── 📁 scripts/                    # 📜 Import Scripts
    ├── 📄 importAddress.js        # 📥 Import địa chỉ từ JSON
    │   └── Parse JSON, validate, import to MongoDB
    └── 📄 importUnits.js          # 📥 Import đơn vị từ JSON
        └── Bulk import units, handle duplicates
```

### 📥 **Data Fetching** (`/fetcher/`)
```
📁 fetcher/
├── 📄 index.js                    # 🌐 Fetch data từ external API
│   └── HTTP requests to address-kit API, save to JSON
└── 📄 schedule.js                 # ⏰ Cron job scheduler
    └── Daily fetch at 3:00 AM, logging, error handling
```

### 💾 **Data Storage** (`/data/`)
```
📁 data/
├── 📄 full-address.json           # 📋 JSON backup data (30K+ records)
│   └── Complete administrative boundaries data
├── 📄 fetch.log                   # 📝 Fetch operation logs
│   └── Timestamp, success/failure, error details
├── 📄 history.json                # 📜 Change history log
│   └── Track data modifications
├── 📄 units.json                  # 🏢 Units data (legacy)
└── 📁 snapshots/                  # 📸 Historical data snapshots
    └── Backup data for different dates
```

### 🧪 **Test Suite** (`/tests/`)
```
📁 tests/
├── 📁 server/                     # 🖥️ API Server Tests
│   ├── 📄 provinces.test.js       # 🏛️ Test province endpoints
│   ├── 📄 communes.test.js        # 🏘️ Test commune endpoints
│   ├── 📄 units.test.js           # 🔧 Test unit CRUD operations
│   ├── 📄 convert.test.js         # 🔄 Test address conversion
│   ├── 📄 search.test.js          # 🔍 Test search functionality
│   ├── 📄 tree.test.js            # 🌳 Test hierarchical data
│   └── 📄 history.test.js         # 📜 Test history tracking
│
├── 📁 integration/                # 🔗 Integration Tests
│   ├── 📄 fullFlow.test.js        # 🔄 End-to-end workflow testing
│   └── 📄 syncJsonMongo.test.js   # 🔄 JSON-MongoDB sync testing
│
├── 📁 middleware/                 # 🔧 Middleware Tests
│   ├── 📄 validateUnit.test.js    # ✅ Test input validation
│   ├── 📄 errorHandler.test.js    # ❌ Test error handling
│   └── 📄 cacheMiddleware.test.js # ⚡ Test caching
│
├── 📁 utils/                      # 🛠️ Utility Tests
│   ├── 📄 db.test.js              # 🗄️ Test database connection
│   ├── 📄 finder.test.js          # 🔍 Test search utilities
│   ├── 📄 loader.test.js          # 📥 Test data loading
│   ├── 📄 response.test.js        # 📤 Test response formatting
│   ├── 📄 file.test.js            # 📁 Test file operations
│   └── 📄 logger.test.js          # 📝 Test logging system
│
├── 📁 scripts/                    # 📜 Script Tests
│   ├── 📄 importAddress.test.js   # 📥 Test address import
│   └── 📄 importUnits.test.js     # 📥 Test units import
│
├── 📁 fetcher/                    # 🌐 Fetcher Tests
│   ├── 📄 index.test.js           # 🌐 Test data fetching
│   └── 📄 schedule.test.js        # ⏰ Test cron scheduling
│
└── 📁 performance/                # ⚡ Performance Tests
    ├── 📄 bulkInsert.test.js      # 🚀 Bulk operations performance
    ├── 📄 testController.js       # 🎮 Test-specific controller
    ├── 📄 testRoutes.js           # 🛣️ Test-specific routes
    └── 📄 test-summary.txt        # 📊 Performance test results
```

### 🛠️ **Shared Utilities** (`/utils/`)
```
📁 utils/
├── 📄 file.js                     # 📁 File operations
│   └── Read/write files, path handling, file validation
└── 📄 logger.js                   # 📝 Logging system
    └── Structured logging, log levels, file output
```

### 📊 **Coverage Reports** (`/coverage/`)
```
📁 coverage/
├── 📄 clover.xml                  # 📊 Clover coverage report
├── 📄 coverage-final.json         # 📊 JSON coverage data
├── 📄 lcov.info                   # 📊 LCOV coverage format
└── 📁 lcov-report/                # 📊 HTML coverage reports
    └── Interactive HTML coverage reports
```

### 📋 **Configuration Files**
```
📄 .env                           # ⚙️ Environment variables
📄 .gitignore                     # 🚫 Git ignore rules
📄 docs.txt                       # 📚 Additional documentation
📄 tests.txt                      # 🧪 Test documentation
```

## 🔧 API Endpoints

### **Provinces (Tỉnh/Thành phố)**
```http
GET /provinces
```
Trả về danh sách tất cả tỉnh/thành phố

### **Communes (Xã/Phường)**
```http
GET /communes                    # Tất cả xã/phường
GET /communes/:provinceID        # Xã/phường theo tỉnh
```

### **Units (CRUD Operations)**
```http
GET    /units                    # Danh sách đơn vị
POST   /units                    # Tạo đơn vị mới
GET    /units/:code              # Chi tiết đơn vị
PUT    /units/:code              # Cập nhật đơn vị
DELETE /units/:code              # Xóa đơn vị
GET    /units/:code/history      # Lịch sử thay đổi
POST   /units/:code/restore      # Khôi phục từ lịch sử
```

### **Convert (Chuyển đổi địa chỉ)**
```http
POST /convert
Content-Type: application/json

{
  "address": "Tỉnh Hà Nội, Phường Hoàn Kiếm"
}
```

### **Search (Tìm kiếm)**
```http
GET /search?name=Hà Nội&level=province
```

### **Tree (Cây phân cấp)**
```http
GET /tree
```

## 🗄️ Database Schema

### **Unit Collection**
```javascript
{
  name: String,                    // Tên đơn vị
  code: String (unique),          // Mã đơn vị
  level: String,                  // Cấp: province/district/commune
  parentCode: String,             // Mã đơn vị cha
  provinceCode: String,           // Mã tỉnh
  provinceName: String,           // Tên tỉnh
  boundary: Object,              // Ranh giới địa lý
  createdAt: Date,
  updatedAt: Date,
  history: Array                  // Lịch sử thay đổi
}
```

### **UnitHistory Collection**
```javascript
{
  code: String,                   // Mã đơn vị
  action: String,                 // create/update/delete/restore
  oldData: Object,                // Dữ liệu cũ
  newData: Object,                // Dữ liệu mới
  changedAt: Date,                // Thời điểm thay đổi
  changedBy: String,               // Người thay đổi
  deleted: Boolean                // Đánh dấu xóa
}
```

## ⚙️ Cấu hình môi trường

Tạo file `.env`:
```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/administrative_boundaries

# API Configuration
API_BASE=https://production.cas.so/address-kit
EFFECTIVE_DATE=latest

# Server
PORT=3000
```

## 🧪 Testing

### **Chạy tests**
```bash
# Chạy tất cả tests
npm test

# Chạy với coverage
npm run test:coverage

# Chạy test cụ thể
npm test -- --testNamePattern="Units API"
```

### **Test Coverage**
- **Server APIs**: 100% coverage cho controllers
- **Middleware**: Validation, error handling
- **Utils**: File operations, database
- **Integration**: Full flow testing
- **Performance**: Bulk operations

## 📊 Monitoring & Logging

### **Log Files**
- `data/fetch.log` - Log fetch operations
- Console logs với timestamp

### **Health Check**
```http
GET /
```
Trả về trạng thái API và danh sách endpoints

## 🔄 Data Flow & Component Interactions

### **1. 🌐 Data Fetching Process**
```
External API (address-kit) 
    ↓ HTTP Request
fetcher/index.js 
    ↓ Parse & Validate
data/full-address.json (30K+ records)
    ↓ Log
data/fetch.log
```

**Chi tiết:**
- `fetcher/index.js`: HTTP GET request đến address-kit API
- Parse JSON response, validate data structure
- Save to `data/full-address.json` với formatting
- Log success/failure to `data/fetch.log`

### **2. 📥 Data Import Process**
```
data/full-address.json
    ↓ Parse & Validate
server/scripts/importUnits.js
    ↓ Bulk Insert
MongoDB (Unit Collection)
    ↓ Create History
MongoDB (UnitHistory Collection)
```

**Chi tiết:**
- `importUnits.js`: Read JSON file, validate data
- Bulk insert vào MongoDB với error handling
- Tạo history records cho mỗi unit
- Handle duplicates và data conflicts

### **3. 🖥️ API Request Flow**
```
Client Request
    ↓ Express Router
server/routes/*.js
    ↓ Middleware
server/middleware/validateUnit.js
    ↓ Business Logic
server/controllers/*.js
    ↓ Database Query
MongoDB/JSON Fallback
    ↓ Response Format
server/utils/response.js
    ↓ Client Response
```

**Chi tiết:**
- Routes: Route matching và parameter extraction
- Middleware: Input validation, authentication, caching
- Controllers: Business logic, data processing
- Database: Primary MongoDB, JSON fallback
- Response: Standardized format, error handling

### **4. ⏰ Auto Sync Process**
```
Cron Job (3:00 AM)
    ↓ Schedule
fetcher/schedule.js
    ↓ Fetch New Data
fetcher/index.js
    ↓ Update JSON
data/full-address.json
    ↓ Sync Database
server/scripts/importUnits.js
    ↓ Update MongoDB
MongoDB Collections
```

**Chi tiết:**
- `schedule.js`: Cron job setup, error handling
- Daily fetch at 3:00 AM với retry logic
- Update JSON file với new data
- Sync changes to MongoDB
- Log all operations

### **5. 🧪 Test Execution Flow**
```
Jest Test Runner
    ↓ Setup
jest.global-setup.js (MongoDB connection)
    ↓ Test Execution
tests/*/**.test.js
    ↓ Mock/Real Data
MongoMemoryServer (in-memory DB)
    ↓ Cleanup
jest.global-teardown.js
```

**Chi tiết:**
- Global setup: Connect to in-memory MongoDB
- Test execution: Isolated test environment
- Mock data: Test-specific data generation
- Cleanup: Database cleanup after each test

### **6. 📊 Performance Testing Flow**
```
Performance Test Suite
    ↓ Test Controller
tests/performance/testController.js
    ↓ Test Routes
tests/performance/testRoutes.js
    ↓ MongoDB Operations
MongoMemoryServer
    ↓ Metrics Collection
Performance Reports
```

**Chi tiết:**
- Test-specific controller: MongoDB-only operations
- Test routes: Simplified routing logic
- Performance metrics: Timing, memory usage
- Reports: Detailed performance analysis

## 🚀 Deployment

### **Production Setup**
1. **MongoDB**: Cài đặt và khởi động MongoDB
2. **Environment**: Cấu hình `.env` file
3. **Data**: Chạy `npm run fetch` để lấy dữ liệu
4. **Import**: Chạy `npm run import-units` để import vào DB
5. **Server**: Chạy `npm run start` để khởi động API
6. **Cron**: Chạy `npm run schedule` để tự động cập nhật

### **Docker Support** (Tùy chọn)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance

### **Optimizations**
- **Dual Storage**: MongoDB + JSON fallback
- **Indexing**: MongoDB indexes cho tìm kiếm nhanh
- **Caching**: Middleware cache cho requests
- **Bulk Operations**: Batch insert/update

### **Benchmarks**
- **API Response**: < 100ms cho simple queries
- **Bulk Import**: ~1000 records/second
- **Search**: < 50ms với MongoDB indexes

## 🔒 Security

### **Input Validation**
- Validate tất cả input parameters
- Sanitize string inputs
- Check data types và formats

### **Error Handling**
- Global error handler
- Structured error responses
- Logging tất cả errors

## 📝 Changelog

### **v1.0.0** (Current)
- ✅ Core API endpoints
- ✅ MongoDB integration
- ✅ CRUD operations với history
- ✅ Auto sync với cron job
- ✅ Comprehensive testing
- ✅ JSON fallback system

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

ISC License

## 👥 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem `docs.txt` cho chi tiết
- **API Docs**: Chạy server và truy cập `http://localhost:3000`

---

**🌏 Administrative Boundaries API** - Quản lý dữ liệu hành chính Việt Nam một cách hiệu quả và tin cậy.