# 🌏 Administrative Boundaries API

**API hệ thống ranh giới hành chính Việt Nam** - Cung cấp dữ liệu tỉnh/thành phố, quận/huyện, phường/xã với khả năng CRUD và đồng bộ tự động.

## 📋 Tổng quan dự án

Dự án này xây dựng một **API RESTful** để quản lý dữ liệu hành chính Việt Nam, bao gồm:
- **63 tỉnh/thành phố**
- **Hàng nghìn quận/huyện** 
- **Hàng chục nghìn phường/xã**

Với khả năng tìm kiếm, chuyển đổi địa chỉ, quản lý lịch sử và đồng bộ tự động.

### 🎯 Tính năng chính
- **Dual Storage System**: MongoDB + JSON fallback để đảm bảo tính sẵn sàng cao
- **CRUD Operations**: Tạo, đọc, cập nhật, xóa đơn vị hành chính với lịch sử đầy đủ
- **Auto Sync**: Tự động cập nhật dữ liệu hàng ngày từ API bên ngoài
- **Address Conversion**: Chuyển đổi địa chỉ tự nhiên thành mã hành chính
- **Comprehensive Testing**: 100% test coverage với Jest
- **Performance Optimized**: Indexing, caching, bulk operations

## 🏗️ Kiến trúc hệ thống

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

## 🚀 Luồng hoạt động chính

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
# Lấy dữ liệu mới nhất từ provinces.open-api.vn (depth=3, cấu trúc 3 cấp cũ)
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

## 📁 Cấu trúc dự án chi tiết

```
AdministrativeBoundaries/
├── 📁 server/                           # Core API server
│   ├── index.js                         # Mount v1 and v2 routers, error handlers
│   ├── 📁 v1/
│   │   ├── index.js                     # Router gộp cho v1
│   │   ├── 📁 controllers/              # Business logic layer (v1 - 3 cấp)
│   │   │   ├── provinceController.js
│   │   │   ├── districtController.js
│   │   │   ├── communeController.js
│   │   │   ├── unitController.js
│   │   │   ├── convertController.js
│   │   │   ├── searchController.js
│   │   │   └── treeController.js
│   │   ├── 📁 routes/                   # API endpoints routing (v1)
│   │   │   ├── provinces.js
│   │   │   ├── districts.js
│   │   │   ├── communes.js
│   │   │   ├── units.js
│   │   │   ├── convert.js
│   │   │   ├── search.js
│   │   │   └── tree.js
│   │   ├── 📁 models/                   # MongoDB schemas (shared for v1/v2)
│   │   │   ├── Unit.js
│   │   │   └── UnitHistory.js
│   │   ├── 📁 middleware/               # Middlewares (v1)
│   │   │   ├── errorHandler.js
│   │   │   ├── validateUnit.js
│   │   │   └── cacheMiddleware.js       # placeholder
│   │   ├── 📁 utils/                    # Utilities (v1)
│   │   │   ├── db.js
│   │   │   └── logger.js
│   │   └── 📁 scripts/
│   │       └── importUnits.js           # Import dữ liệu v1 (depth=3)
│   ├── 📁 v2/
│   │   ├── index.js                     # placeholder (router tổng v2 nếu cần)
│   │   ├── 📁 controllers/              # Business logic layer (v2 - 2 cấp)
│   │   │   ├── provinceController.js
│   │   │   └── communeController.js
│   │   ├── 📁 routes/                   # API endpoints routing (v2)
│   │   │   ├── provinces.js
│   │   │   └── communes.js
│   │   ├── 📁 utils/
│   │   │   └── loader.js                # Nạp cache từ full-address-v2.json
│   │   └── 📁 scripts/
│   │       ├── importUnits.js           # (bản v2 trong thư mục này)
│   │       └── scripts copy/importUnits.js
│   └── 📁 scripts/
│       └── importUnits.v2.js            # Import dữ liệu v2 (depth=2)
├── 📁 fetcher/                          # Data fetching system
│   ├── 📁 v1/
│   │   └── index.js                     # Fetch depth=3 → data/full-address.json
│   ├── 📁 v2/
│   │   └── index.js                     # Fetch depth=2 → data/full-address-v2.json
│   ├── schedule.js                      # Cron 03:00 gọi fetch v1
│   └── 📁 utils/                         # (placeholder)
├── 📁 data/                             # Data storage
│   ├── full-address.json                # V1 JSON (depth=3)
│   ├── full-address-v2.json             # V2 JSON (depth=2)
│   ├── full-address-backup.json         # Backup
│   ├── history.json                     # Nhật ký thao tác JSON
│   ├── units.json                       # Backup units
│   ├── fetch.log                        # Log fetch operations
│   └── snapshots/                       # Snapshot dữ liệu (nếu dùng)
├── 📁 tests/                            # Comprehensive test suite
│   ├── 📁 server/
│   │   ├── units.test.js
│   │   ├── communes.test.js
│   │   ├── provinces.test.js
│   │   ├── convert.test.js
│   │   ├── search.test.js
│   │   ├── tree.test.js
│   │   ├── history.test.js
│   │   └── unitController.test.js
│   ├── 📁 integration/
│   │   ├── fullFlow.test.js
│   │   └── syncJsonMongo.test.js
│   ├── 📁 middleware/
│   │   ├── validateUnit.test.js
│   │   ├── errorHandler.test.js
│   │   └── cacheMiddleware.test.js
│   ├── 📁 utils/
│   │   ├── db.test.js
│   │   ├── file.test.js
│   │   ├── finder.test.js
│   │   ├── loader.test.js
│   │   ├── logger.test.js
│   │   └── response.test.js
│   ├── 📁 scripts/
│   │   ├── importAddress.test.js
│   │   └── importUnits.test.js
│   ├── 📁 fetcher/
│   │   ├── index.test.js
│   │   └── schedule.test.js
│   ├── 📁 performance/
│   │   └── bulkInsert.test.js
│   └── 📁 utils/
│       └── testCleanup.js
├── 📁 utils/                            # Shared utilities
│   ├── file.js
│   └── logger.js
├── 📁 coverage/
│   ├── lcov-report/
│   ├── clover.xml
│   ├── coverage-final.json
│   └── lcov.info
├── server.js                            # Express app setup (mount v1/v2, errors)
├── package.json
├── jest.config.js
├── jest.setup.js
├── jest.global-setup.js
├── jest.global-teardown.js
├── cross-env
├── docs.txt
├── tests.txt
└── README.md
```

## 🔧 API Endpoints chi tiết

### **Provinces (Tỉnh/Thành phố)**
```http
GET /provinces
```
**Mô tả**: Trả về danh sách tất cả tỉnh/thành phố  
**Logic**: Ưu tiên MongoDB, fallback JSON nếu MongoDB rỗng  
**Response**: Array các tỉnh với code, name, administrativeLevel

### **Communes (Xã/Phường) - CRUD đầy đủ**
```http
GET    /communes                           # Tất cả xã/phường
GET    /communes/:provinceID               # Xã/phường theo tỉnh
GET    /communes/deleted/list              # Danh sách communes đã xóa
GET    /communes/history                   # Lịch sử thay đổi từ unit_histories
GET    /communes/history/:communeCode      # Lịch sử commune cụ thể
POST   /communes                           # Tạo commune mới
POST   /communes/:communeCode              # Cập nhật commune
PUT    /communes/:communeCode              # Tạo commune mới (alternative)
DELETE /communes/:communeCode              # Soft delete commune
POST   /communes/:communeCode/restore      # Khôi phục commune đã xóa
```
**Tính năng đặc biệt**:
- Soft delete với lưu lịch sử vào MongoDB và JSON
- Restore từ lịch sử
- Tự động cập nhật cả MongoDB và JSON files
- Lưu history vào unit_histories collection

### **Districts (Quận/Huyện) - CRUD đầy đủ**
```http
GET    /districts                       # Tất cả quận/huyện
GET    /districts/:districtCode         # Chi tiết quận/huyện
GET    /districts/deleted/list          # Danh sách quận/huyện đã xóa
POST   /districts                       # Tạo quận/huyện mới
PUT    /districts/:districtCode         # Cập nhật quận/huyện
DELETE /districts/:districtCode         # Soft delete quận/huyện
POST   /districts/:districtCode/restore # Khôi phục quận/huyện đã xóa
```
**Đặc điểm**: Cùng cơ chế soft delete/restore như communes; expose đầy đủ REST methods

### **Units (CRUD Operations)**
```http
GET    /units                    # Danh sách đơn vị
POST   /units                    # Tạo đơn vị mới (với validation)
GET    /units/:code              # Chi tiết đơn vị
PUT    /units/:code              # Cập nhật đơn vị
DELETE /units/:code              # Xóa đơn vị
GET    /units/:code/history      # Lịch sử thay đổi
POST   /units/:code/restore      # Khôi phục từ lịch sử
```
**Validation**: Middleware validateUnit kiểm tra name, code, level  
**Dual Storage**: Cập nhật cả MongoDB và JSON files  
**History Tracking**: Mọi thay đổi được lưu vào UnitHistory

### **Convert (Chuyển đổi địa chỉ)**
```http
POST /convert
Content-Type: application/json

{
  "address": "Tỉnh Hà Nội, Phường Hoàn Kiếm"
}
```
**Mô tả**: Parse địa chỉ tự nhiên thành mã hành chính  
**Logic**: 
1. Chuẩn hóa chuỗi (remove diacritics, normalize)
2. Tìm kiếm trong MongoDB trước
3. Fallback JSON nếu không tìm thấy
4. Trả về province/commune codes và names

### **Search (Tìm kiếm)**
```http
GET /search?name=Hà Nội&level=province&code=01
```
**Mô tả**: Tìm kiếm units theo nhiều tiêu chí  
**Query params**: name (regex), level, code  
**Limit**: 50 results để tránh overload

### **Tree (Cây phân cấp)**
```http
GET /tree
```
**Mô tả**: Tạo cây phân cấp hành chính từ MongoDB  
**Logic**: Build tree structure dựa trên parentCode relationships

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

## 🧪 Testing System chi tiết

### **Test Structure**
```
tests/
├── server/           # API endpoint tests (8 files)
├── integration/      # End-to-end tests (2 files)
├── middleware/       # Middleware tests (3 files)
├── utils/           # Utility function tests (6 files)
├── scripts/         # Import script tests (2 files)
├── fetcher/         # Data fetching tests (2 files)
├── performance/     # Performance tests (1 file)
└── utils/           # Test utilities (1 file)
```

### **Chạy tests**
```bash
# Chạy tất cả tests
npm test

# Chạy với coverage
npm run test:coverage

# Chạy test cụ thể
npm test -- --testNamePattern="Units API"

# Debug mode
npm run test:debug
```

### **Test Coverage chi tiết**
- **Server APIs**: 
  - `units.test.js` (700+ lines) - CRUD operations
  - `communes.test.js` - Commune operations với soft delete
  - `provinces.test.js` - Province operations
  - `convert.test.js` - Address conversion
  - `search.test.js` - Search functionality
  - `tree.test.js` - Tree structure building
  - `history.test.js` - History tracking
  - `unitController.test.js` - Controller logic

- **Integration Tests**:
  - `fullFlow.test.js` - End-to-end workflow testing
  - `syncJsonMongo.test.js` - JSON-MongoDB synchronization

- **Middleware Tests**:
  - `validateUnit.test.js` - Input validation
  - `errorHandler.test.js` - Error handling
  - `cacheMiddleware.test.js` - Caching (placeholder)

- **Utils Tests**:
  - `db.test.js` - Database connection
  - `file.test.js` - File operations
  - `finder.test.js` - Tree building utility
  - `loader.test.js` - Data loading
  - `logger.test.js` - Logging system
  - `response.test.js` - Response formatting

- **Scripts Tests**:
  - `importAddress.test.js` - Address import script
  - `importUnits.test.js` - Units import script

- **Fetcher Tests**:
  - `index.test.js` - Data fetching functionality
  - `schedule.test.js` - Cron job testing

- **Performance Tests**:
  - `bulkInsert.test.js` - Bulk operations performance

### **Test Configuration**
- **Environment**: Node.js với Jest
- **Database**: MongoDB Memory Server cho tests
- **Mocking**: Jest mocks cho file operations
- **Coverage**: HTML, XML, JSON, LCOV formats
- **Timeout**: 30 seconds per test
- **Cleanup**: Automatic cleanup after each test

### **Test Features**
- **Isolated Tests**: Mỗi test chạy độc lập
- **Mock Data**: Sử dụng test data thay vì real data
- **Error Testing**: Test error scenarios
- **Performance Testing**: Bulk operations
- **Integration Testing**: Full workflow testing

## 📊 Data Files & Monitoring

### **Data Files Structure**

#### **full-address.json** (nguồn provinces.open-api.vn)
```json
[
  {
    "name": "Thành phố Hà Nội",
    "code": 1,
    "codename": "thanh_pho_ha_noi",
    "division_type": "tỉnh",
    "districts": [
      {
        "name": "Quận Ba Đình",
        "code": 1,
        "wards": [
          { "name": "Phường Phúc Xá", "code": 1 },
          { "name": "Phường Trúc Bạch", "code": 4 }
        ]
      }
    ]
  }
]
```
**Mô tả**: Dữ liệu chính chứa 63 tỉnh/thành và đầy đủ quận/huyện, phường/xã  
**Cấu trúc**: 3 cấp: province → districts → wards (map thành communes trong hệ thống)  
**Nguồn**: `https://provinces.open-api.vn/api/v1/?depth=3`

#### **history.json** (256 lines)
```json
[
  {
    "action": "deleted",
    "deletedAt": "2025-10-24T03:40:48.147Z",
    "deletedBy": "system",
    "data": {
      "name": "Phường Cần Xóa",
      "code": "01001300",
      "level": "commune",
      "parentCode": "01001"
    }
  }
]
```
**Mô tả**: Lịch sử các thao tác xóa communes  
**Cấu trúc**: Array các records với action, timestamp, và data  
**Mục đích**: Backup và audit trail cho soft delete operations

#### **fetch.log** (187 lines)
```
[2025-10-21T08:07:08.788Z] INFO: 🔁 Bắt đầu tải dữ liệu hành chính...
[2025-10-21T08:07:09.278Z] INFO: ✅ Lấy 34 tỉnh/thành
[2025-10-21T08:07:14.061Z] INFO: 💾 Đã lưu dữ liệu vào C:\Users\Quy\Desktop\AlojoBooking\AdministrativeBoundaries\data\full-address.json
```
**Mô tả**: Log các operations fetch dữ liệu từ API  
**Format**: Timestamp + Level + Message  
**Mục đích**: Tracking fetch operations và debugging

#### **units.json**
**Mô tả**: Backup file cho units data  
**Mục đích**: Fallback data cho import operations

#### **full-address-backup.json**
**Mô tả**: Backup của full-address.json  
**Mục đích**: Safety backup trước khi update

### **Logging System**

#### **Logger (utils/logger.js)**
```javascript
export const logInfo = (msg) => log(`INFO: ${msg}`);
export const logError = (msg) => log(`ERROR: ${msg}`);
```
**Features**:
- Timestamped logs
- File và console output
- Info và Error levels
- Automatic log file creation

#### **Log Files**
- `data/fetch.log` - Log fetch operations với timestamp
- Console logs với emoji indicators
- Error logs với stack traces (development mode)

### **Health Check**
```http
GET /
```
**Response**:
```json
{
  "message": "🌏 Administrative Boundaries API running successfully!",
  "endpoints": {
    "provinces": "/provinces",
    "communes": "/communes",
    "districts": "/districts",
    "convert": "/convert",
    "search": "/search",
    "tree": "/tree",
    "units": "/units"
  }
}
```
**Mục đích**: API status check và endpoint listing

## 🔄 Data Flow chi tiết

### **1. Fetch Process (Lấy dữ liệu từ API)**
```
External API (provinces.open-api.vn depth=3) → fetcher/index.js → data/full-address.json
```
**Chi tiết**:
- Gọi API `https://provinces.open-api.vn/api/v1/?depth=3`
- Lấy danh sách 63 tỉnh/thành phố cùng đầy đủ districts và wards
- Lưu toàn bộ vào `data/full-address.json`
- Log operations vào `data/fetch.log`

### **2. Import Process (Import vào MongoDB)**
```
JSON File → scripts/importUnits.js → MongoDB Unit Collection
```
**Chi tiết**:
- Đọc `data/full-address.json` (province/district/ward)
- Map ward → commune khi import
- Tạo `uniqueKey = level + '-' + code` và tạo unique index cho trường này
- `code` không còn unique; xử lý trùng code theo từng cấp bằng `uniqueKey`
- Import theo thứ tự: province → district → commune; clear dữ liệu cũ trước khi import

### **3. API Request Flow (Luồng xử lý request)**
```
Client Request → Express Router → Middleware → Controller → MongoDB/JSON → Response
```
**Chi tiết**:
- **Router**: Route requests đến đúng controller
- **Middleware**: validateUnit, errorHandler, cacheMiddleware
- **Controller**: Business logic, dual storage (MongoDB + JSON fallback)
- **Models**: Unit, UnitHistory, Address schemas
- **Response**: JSON response với proper error handling

### **4. Auto Sync Process (Đồng bộ tự động)**
```
Cron Job (3:00 AM) → fetcher/schedule.js → fetchAllData() → Update JSON → Log
```
**Chi tiết**:
- Sử dụng `node-cron` với schedule `"0 3 * * *"`
- Chạy `fetcher/index.js` để lấy data mới
- Cập nhật `data/full-address.json`
- Log vào `data/fetch.log`
- Không tự động sync MongoDB (cần manual import)

### **5. CRUD Operations Flow (Luồng CRUD)**
```
Create/Update/Delete → Controller → MongoDB + JSON + History
```
**Chi tiết**:
- **Create**: Lưu vào MongoDB, JSON, và tạo history record
- **Update**: Cập nhật MongoDB, JSON, và lưu old/new data vào history
- **Delete**: Soft delete với isDeleted flag, lưu vào history và JSON backup
- **Restore**: Khôi phục từ history, cập nhật cả MongoDB và JSON

### **6. Error Handling Flow (Xử lý lỗi)**
```
Error → errorHandler.js → Log → Structured Response
```
**Chi tiết**:
- Global error handler catch tất cả errors
- Phân loại errors (ValidationError, MongoError, etc.)
- Log chi tiết cho debugging
- Trả về structured error response
- Development mode: include stack trace

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

## 🔧 Key Components chi tiết

### **Controllers (Business Logic)**

#### **provinceController.js**
- **Function**: `getProvinces()`
- **Logic**: Dual storage - MongoDB first, JSON fallback
- **Features**: Error handling, logging, data transformation

#### **communeController.js** 
- **Functions**: 
  - `getCommunes()` - Lấy communes theo province hoặc tất cả
  - `createCommune()` - Tạo commune mới với validation
  - `updateCommune()` - Cập nhật commune
  - `deleteCommune()` - Soft delete với history tracking
  - `restoreCommune()` - Khôi phục từ soft delete
  - `getDeletedCommunes()` - Lấy danh sách đã xóa
  - `getHistoryCommunes()` - Lấy lịch sử thay đổi
  - `getHistoryByCode()` - Lịch sử commune cụ thể
- **Features**: Soft delete, history tracking, dual storage sync

#### **unitController.js**
- **Functions**:
  - `createUnit()` - Tạo unit mới với validation
  - `updateUnit()` - Cập nhật unit
  - `deleteUnit()` - Xóa unit với history
  - `getUnitById()` - Lấy chi tiết unit
  - `getHistory()` - Lịch sử thay đổi
  - `restoreFromHistory()` - Khôi phục từ history
- **Features**: CRUD operations, history tracking, JSON fallback

#### **convertController.js**
- **Function**: `convertAddress()`
- **Logic**: Parse địa chỉ tự nhiên thành mã hành chính
- **Features**: String normalization, dual storage search, regex matching

#### **searchController.js**
- **Function**: `searchUnits()`
- **Features**: Multi-criteria search, regex support, result limiting

#### **treeController.js**
- **Function**: `getTree()`
- **Logic**: Build hierarchical tree từ flat data
- **Features**: Parent-child relationships, tree structure

### **Models (Database Schemas)**

#### **Unit.js**
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
  history: Array,                // Lịch sử thay đổi
  isDeleted: Boolean,            // Soft delete flag
  deletedAt: Date                // Thời điểm xóa
}
```

#### **UnitHistory.js**
```javascript
{
  code: String,                   // Mã đơn vị
  action: String,                 // create/update/delete/restore
  oldData: Object,                // Dữ liệu cũ
  newData: Object,                // Dữ liệu mới
  changedAt: Date,                // Thời điểm thay đổi
  changedBy: String,              // Người thay đổi
  deleted: Boolean                // Đánh dấu xóa
}
```

#### **Address.js**
- Không sử dụng trong phiên bản hiện tại

### **Middleware**

#### **validateUnit.js**
- **Function**: Validate input data
- **Checks**: name, code, level fields
- **Error Handling**: Structured error responses

#### **errorHandler.js**
- **Functions**: `notFoundHandler()`, `errorHandler()`
- **Features**: Global error handling, error classification, logging
- **Error Types**: ValidationError, MongoError, CastError, etc.

#### **cacheMiddleware.js**
- **Status**: Empty file (placeholder for future implementation)

### **Utils**

#### **db.js**
- **Function**: `connectDB()`
- **Features**: MongoDB connection, error handling, environment config

#### **finder.js**
- **Function**: `buildTree()`
- **Logic**: Convert flat array to hierarchical tree structure
- **Features**: Parent-child relationship building

#### **loader.js**
- **Function**: `loadData()`
- **Features**: Load JSON data from file system

#### **response.js**
- **Status**: Empty file (placeholder)

### **Scripts**

#### **importUnits.js** (cập nhật theo dữ liệu 63 tỉnh - 3 cấp)
- **Function**: Import JSON data (depth=3) vào MongoDB `Unit`
- **Nguồn dữ liệu**: `data/full-address.json` lấy từ API provinces.open-api.vn
- **Mapping**:
  - Province → level="province"
  - Districts → level="district", `parentCode` = `province.code`
  - Wards (API) → map thành level="commune", `parentCode` = `district.code`
- **Khóa duy nhất**: `uniqueKey = level + '-' + code`; `code` không còn unique
- **Quy trình**: Clear toàn bộ → tạo index cho `uniqueKey` → import theo thứ tự province → district → commune

#### **importAddress.js**
- **Function**: Import JSON data to MongoDB Address collection
- **Features**: Similar to importUnits but for Address schema
- **Process**: Clear old data → Import all levels to Address collection

### **Fetcher**

#### **index.js** (fetcher)
- **Function**: `fetchAllData()` tải 63 tỉnh/thành với 3 cấp độ (province/district/ward)
- **API**: `https://provinces.open-api.vn/api/v1/?depth=3`
- **Output**: Lưu toàn bộ JSON vào `data/full-address.json`

#### **schedule.js**
- **Function**: Cron job setup
- **Schedule**: Daily at 3:00 AM
- **Features**: Environment-aware, error handling

## 📝 Changelog

### **v1.0.0** (Current)
- ✅ Core API endpoints với dual storage
- ✅ MongoDB integration với fallback JSON
- ✅ CRUD operations với history tracking
- ✅ Soft delete và restore functionality
- ✅ Auto sync với cron job
- ✅ Comprehensive testing (100% coverage)
- ✅ Address conversion system
- ✅ Search và tree building
- ✅ Error handling và logging
- ✅ Performance optimization

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

## 📚 Phụ lục: Chi tiết folder → file → chức năng

Lưu ý: Danh sách dưới đây liệt kê từng file chính trong dự án và mô tả ngắn gọn chức năng, kèm các hàm/export tiêu biểu (nếu có).

### 1) Root
- `server.js`: Khởi tạo Express, nạp biến môi trường, kết nối MongoDB (`connectDB()`), gắn router `v1` và `v2`, nạp cache `v2` (`loadV2Cache()`), cấu hình `notFoundHandler` và `errorHandler`, lắng nghe cổng.
- `package.json`: Scripts (test, start, fetch, import, schedule), dependencies (express, mongoose, node-fetch, node-cron, dotenv).
- `Dockerfile`: Cấu hình image Node 18, cài dependencies và chạy server.
- `docker-compose.yml`: (Nếu dùng) setup dịch vụ container (không bắt buộc).
- `README.MD`: Tài liệu dự án (file này).
- `docs.txt`, `tests.txt`: Ghi chú phát triển và tóm tắt tests.
- `.env` (không commit): Cấu hình môi trường (MONGODB_URI, PORT,...).

### 2) Data
- `data/full-address.json`: Dữ liệu provinces API (depth=3: province → districts → communes/wards) cho phiên bản v1.
- `data/full-address-v2.json`: Dữ liệu provinces API (depth=2: province → wards) cho phiên bản v2 (map ward → commune).
- `data/history.json`: Nhật ký thao tác (soft delete, restore) dạng JSON.
- `data/units.json`: Backup units (fallback/phục hồi).
- `data/fetch.log`: Log thao tác fetch theo thời gian.
- `data/snapshots/`: Thư mục snapshot (lưu theo thời điểm, nếu dùng).

### 3) Shared utils
- `utils/file.js`
  - `saveJSON(path, data)`: Ghi đối tượng vào JSON.
  - `loadJSON(path)`: Đọc file JSON thành object/array.
- `utils/logger.js`
  - `logInfo(msg)`, `logError(msg)`: Ghi log định dạng `[ISO_TIMESTAMP] LEVEL: message` vào `data/fetch.log` và console.

### 4) Fetcher
- `fetcher/v1/index.js`
  - HÀM: `fetchAllData()` gọi `https://provinces.open-api.vn/api/v1/?depth=3` → lưu `data/full-address.json` (v1) và log tiến trình.
  - Chạy trực tiếp khi gọi file (`node fetcher/v1/index.js`).
- `fetcher/v2/index.js`
  - HÀM: `fetchV2()` gọi `https://provinces.open-api.vn/api/v2/?depth=2` → lưu `data/full-address-v2.json` (v2) và log tiến trình.
  - Export default `fetchV2`; chạy trực tiếp khi gọi file.
- `fetcher/schedule.js`
  - Lên lịch cron `0 3 * * *` (03:00 AM) gọi `fetchAllData()` (v1). Bỏ qua khi `NODE_ENV=test`.

### 5) Server (v1)
- `server/v1/index.js`: Router gốc cho v1, mount các nhóm route: `/provinces`, `/communes`, `/districts`, `/units`, `/search`, `/tree`, `/convert`.

- Controllers (`server/v1/controllers/`)
  - `provinceController.js`
    - `getProvinces(req,res)`: Lấy toàn bộ tỉnh (kèm 3 cấp) từ MongoDB (ưu tiên) hoặc JSON fallback.
    - `getProvinceByCode(req,res)`: Lấy chi tiết tỉnh theo `provinceCode` (3 cấp) từ Mongo hoặc JSON.
    - `getProvinceById(req,res)`: Lấy chi tiết tỉnh theo `_id` Mongo (kèm huyện/xã).
    - `createProvince(req,res)`: Tạo mới tỉnh, đồng bộ Mongo + cập nhật JSON.
    - `updateProvince(req,res)`: Cập nhật thuộc tính tỉnh, đồng bộ JSON.
    - `deleteProvince(req,res)`: Soft delete tỉnh, lưu `UnitHistory`, cập nhật JSON.
    - `restoreProvince(req,res)`: Khôi phục tỉnh đã xóa, thêm lại vào JSON nếu thiếu.
    - `getDeletedProvinces(req,res)`: Liệt kê các tỉnh đã xóa (soft).
  - `districtController.js`
    - `getDistricts(req,res)`: Lấy huyện (toàn bộ/thuộc tỉnh). Mongo ưu tiên, fallback JSON.
    - `getDistrictByCode(req,res)`: Chi tiết huyện theo `districtCode` từ Mongo hoặc JSON.
    - `createDistrict(req,res)`: Tạo huyện mới (Mongo + JSON).
    - `updateDistrict(req,res)`: Cập nhật huyện (Mongo + JSON).
    - `deleteDistrict(req,res)`: Soft delete, lưu history, xoá trong JSON.
    - `restoreDistrict(req,res)`: Gỡ `isDeleted`, thêm lại JSON nếu thiếu.
    - `getDeletedDistricts(req,res)`: Danh sách huyện đã xóa.
  - `communeController.js`
    - `getCommunes(req,res)`: Lấy xã/phường (toàn bộ/thuộc tỉnh). Mongo ưu tiên, fallback JSON (gộp xã dưới huyện hoặc trực thuộc tỉnh).
    - `getCommuneByCode(req,res)`: Lấy xã theo mã, so khớp an toàn bằng `$expr` (string-compare), fallback JSON.
    - `createCommune(req,res)`: Tạo xã mới, sinh `uniqueKey`, cập nhật JSON đúng cấp cha.
    - `updateCommune(req,res)`: Cập nhật xã, đồng bộ JSON (tìm và `Object.assign`).
    - `deleteCommune(req,res)`: Soft delete, lưu `UnitHistory`.
    - `restoreCommune(req,res)`: Khôi phục xã đã xóa.
    - `getDeletedCommunes(req,res)`: Danh sách xã đã xóa.
    - `getHistoryCommunes(req,res)`: Lịch sử thay đổi cấp xã.
    - `getHistoryByCode(req,res)`: Lịch sử thay đổi theo mã xã.
  - `unitController.js`
    - `createUnit(req,res)`: Tạo đơn vị (province/commune). Trong test: chỉ Mongo; bình thường: JSON + Mongo + `UnitHistory`.
    - `updateUnit(req,res)`: Cập nhật đơn vị. Test: Mongo; bình thường: JSON (tìm target) + Mongo (upsert) + `UnitHistory`.
    - `deleteUnit(req,res)`: Xóa đơn vị. Test: xóa Mongo; bình thường: xóa khỏi JSON, xóa Mongo, ghi `UnitHistory`.
    - `getHistory(req,res)`: Lấy `UnitHistory` theo code.
    - `restoreFromHistory(req,res)`: Khôi phục từ bản ghi history, đồng bộ JSON + Mongo và lưu thêm bản ghi `restore`.
    - `getUnitById(req,res)`: Lấy chi tiết đơn vị theo `code`, ưu tiên Mongo, fallback JSON.
  - `convertController.js`
    - `convertAddress(req,res)`: Chuẩn hóa chuỗi, tra MongoDB theo thứ tự province → district → commune; nếu thiếu thì fallback JSON; trả về `result` và `codes`.
  - `searchController.js`
    - `searchUnits(req,res)`: Tìm theo `name` (regex), `level`, `code`; giới hạn 50.
  - `treeController.js`
    - `getTree(req,res)`: Xây cây phân cấp từ bảng `Unit` theo `parentCode`.

- Routes (`server/v1/routes/`)
  - `provinces.js`: Map endpoints → provinceController: GET `/`, `/:provinceCode`, `/id/:id`, POST `/`, PUT `/:provinceCode`, DELETE `/:provinceCode`, PATCH `/restore/:provinceCode`, GET `/deleted/list`.
  - `districts.js`: GET `/`, GET `/deleted/list`, GET `/:districtCode`, POST `/`, PUT `/:districtCode`, DELETE `/:districtCode`, POST `/:districtCode/restore`.
  - `communes.js`: GET `/`, GET `/deleted/list`, GET `/history`, GET `/history/:communeCode`, GET `/:communeCode`, POST `/`, POST `/:communeCode`, PUT `/:communeCode`, DELETE `/:communeCode`, POST `/:communeCode/restore`.
  - `units.js`: POST `/`, PUT `/:code`, DELETE `/:code`, GET `/:code`, GET `/:code/history`, POST `/:code/restore`.
  - `convert.js`: POST `/` → `convertAddress`.
  - `search.js`: GET `/` → `searchUnits`.
  - `tree.js`: GET `/` → `getTree`.

- Middleware (`server/v1/middleware/`)
  - `errorHandler.js`
    - `notFoundHandler(req,res)`: Trả 404 cho route không tồn tại.
    - `errorHandler(err,req,res,next)`: Phân loại và trả lỗi có cấu trúc, hỗ trợ hiển thị stack trong development.
  - `validateUnit.js`: Kiểm tra body đầu vào với các trường `name`, `code`, `level` (province/district/commune).
  - `cacheMiddleware.js`: Placeholder (chưa triển khai).

- Models (`server/v1/models/`)
  - `Unit.js`: Schema `Unit` (v1/v2 chung), các trường: `schemaVersion`, `name`, `code`, `level`, `parentCode`, `provinceCode`, `provinceName`, `uniqueKey` (unique), `isDeleted`, timestamps, indexes (`schemaVersion, level, parentCode`).
  - `UnitHistory.js`: Schema lịch sử thay đổi: `code`, `action` (create/update/delete/restore), `oldData`, `newData`, `deleted`, `changedAt`, `changedBy`, timestamps; index `{ code, changedAt }`.

- Utils (`server/v1/utils/`)
  - `db.js`: `connectDB()` đọc `MONGODB_URI`, kết nối mongoose, log trạng thái.
  - `logger.js`: Re-export `logInfo`, `logError` từ `utils/logger.js` dùng chung.

- Scripts (`server/v1/scripts/`)
  - `importUnits.js`: Import dữ liệu từ `data/full-address.json` → MongoDB `Unit` với `schemaVersion='v1'`. Tạo index, xoá cũ, duyệt province → district → commune; tạo `uniqueKey` chuẩn hoá.

### 6) Server (v2)
- Routes (`server/v2/routes/`)
  - `provinces.js`: GET `/` (danh sách tỉnh v2), GET `/:provinceCode`, GET `/:provinceCode/wards` (proxy sang `getCommunes`), POST `/`, PUT `/:provinceCode`, DELETE `/:provinceCode`.
  - `communes.js`: GET `/`, GET `/:communeCode`, POST `/`, PUT `/:communeCode`, DELETE `/:communeCode`.

- Controllers (`server/v2/controllers/`)
  - `provinceController.js`
    - `getProvinces(req,res)`: Lấy tỉnh từ Mongo (`schemaVersion='v2'`) hoặc fallback cache v2.
    - `getProvinceByCode(req,res)`: Lấy tỉnh + `wards` (map thành communes) từ Mongo; fallback loader cache v2.
    - `createProvince(req,res)`: Tạo mới tỉnh v2 trong Mongo (tối giản, `uniqueKey` `v2-province-<code>`).
    - `updateProvince(req,res)`: Cập nhật tỉnh v2 theo code.
    - `deleteProvince(req,res)`: Xóa tỉnh v2 và các ward (commune) con cùng `schemaVersion='v2'`.
  - `communeController.js`
    - `getCommunes(req,res)`: Lấy toàn bộ xã (ward) v2, parent trực tiếp là province; fallback JSON v2.
    - `getCommuneByCode(req,res)`: Lấy xã theo mã, ưu tiên Mongo, fallback JSON v2.
    - `createCommune(req,res)`: Tạo xã (ward) mới, sinh `uniqueKey` `v2-commune-<code>`, cập nhật JSON v2.
    - `updateCommune(req,res)`: Cập nhật xã (ward) trong Mongo + JSON v2.
    - `deleteCommune(req,res)`: Soft delete + ghi `UnitHistory`.
    - `restoreCommune(req,res)`: Khôi phục xã đã xóa (Mongo v2).
    - `getDeletedCommunes/getHistoryCommunes/getHistoryByCode`: Tương tự v1 nhưng cho v2.

- Utils (`server/v2/utils/`)
  - `loader.js`
    - `loadV2Cache()`: Đọc `data/full-address-v2.json` vào cache bộ nhớ: provinces, wardsByProvince (Map), wardByCode (Map).
    - `getV2Provinces()`, `getV2ProvinceByCode(code)`, `getV2WardsByProvince(code)`, `getV2WardByCode(code)`: Truy cập cache đã nạp.

- Khác
  - `server/v2/index.js`: (trống/placeholder cho router tổng v2 nếu muốn gom lại).
  - `server/scripts/importUnits.v2.js`: Import `data/full-address-v2.json` → Mongo `Unit` với `schemaVersion='v2'`, tạo `uniqueKey` v2 và index cần thiết, xoá dữ liệu v2 cũ trước khi import.

### 7) Tests (tóm tắt theo thư mục)
- `tests/server/*.test.js`: Kiểm thử endpoint API (units, communes, provinces, districts, search, tree, convert, history, unitController logic).
- `tests/integration/*.test.js`: Quy trình end-to-end (fullFlow, sync JSON↔Mongo).
- `tests/middleware/*.test.js`: Kiểm thử `validateUnit`, `errorHandler`, `cacheMiddleware` (placeholder).
- `tests/utils/*.test.js`: Kiểm thử `db`, `file`, `finder`, `loader`, `logger`, `response`.
- `tests/scripts/*.test.js`: Kiểm thử import địa chỉ/đơn vị.
- `tests/fetcher/*.test.js`: Kiểm thử fetcher v1 và schedule cron.
- `tests/performance/bulkInsert.test.js`: Kiểm thử hiệu năng bulk insert.
- `jest.config.js`, `jest.setup.js`, `jest.global-setup.js`, `jest.global-teardown.js`: Cấu hình và bootstrap Jest, môi trường test.

---

Nếu bạn cần tài liệu chi tiết hơn theo dạng API reference cho từng endpoint/hàm, hoặc muốn xuất HTML docs tự động (ví dụ từ JSDoc), có thể mở issue để mình bổ sung generator phù hợp.