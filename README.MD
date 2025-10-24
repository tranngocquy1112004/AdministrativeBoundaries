# 🌏 Administrative Boundaries API

**API hệ thống ranh giới hành chính Việt Nam** - Cung cấp dữ liệu tỉnh/thành phố, quận/huyện, phường/xã với khả năng CRUD và đồng bộ tự động.

## 📋 Tổng quan dự án

Dự án này xây dựng một **API RESTful** để quản lý dữ liệu hành chính Việt Nam, bao gồm:
- **34 tỉnh/thành phố**
- **Hàng nghìn quận/huyện** 
- **Hàng chục nghìn phường/xã**

Với khả năng tìm kiếm, chuyển đổi địa chỉ, quản lý lịch sử và đồng bộ tự động.

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

## 📁 Cấu trúc dự án

```
AdministrativeBoundaries/
├── 📁 server/                    # Core API server
│   ├── 📁 controllers/           # Business logic
│   │   ├── provinceController.js # Xử lý tỉnh/thành phố
│   │   ├── communeController.js  # Xử lý xã/phường
│   │   ├── unitController.js     # CRUD đơn vị hành chính
│   │   ├── convertController.js  # Chuyển đổi địa chỉ
│   │   ├── searchController.js   # Tìm kiếm
│   │   └── treeController.js     # Cây phân cấp
│   ├── 📁 models/                # MongoDB schemas
│   │   ├── Unit.js              # Schema đơn vị hành chính
│   │   ├── UnitHistory.js       # Schema lịch sử thay đổi
│   │   └── Address.js           # Schema địa chỉ
│   ├── 📁 routes/               # API endpoints
│   │   ├── provinces.js         # /provinces
│   │   ├── communes.js          # /communes
│   │   ├── units.js             # /units (CRUD)
│   │   ├── convert.js           # /convert
│   │   ├── search.js            # /search
│   │   └── tree.js              # /tree
│   ├── 📁 middleware/           # Middleware functions
│   │   ├── validateUnit.js      # Validation input
│   │   ├── errorHandler.js      # Xử lý lỗi
│   │   └── cacheMiddleware.js   # Cache layer
│   ├── 📁 utils/                # Utility functions
│   │   ├── db.js               # Kết nối MongoDB
│   │   ├── finder.js           # Tìm kiếm trong JSON
│   │   ├── loader.js           # Load dữ liệu
│   │   └── response.js         # Format response
│   └── 📁 scripts/             # Import scripts
│       ├── importAddress.js    # Import địa chỉ
│       └── importUnits.js      # Import đơn vị
├── 📁 fetcher/                  # Data fetching
│   ├── index.js                # Fetch từ API
│   └── schedule.js             # Cron job
├── 📁 data/                     # Data storage
│   ├── full-address.json       # Dữ liệu JSON backup
│   ├── fetch.log              # Log fetch operations
│   └── snapshots/             # Lịch sử dữ liệu
├── 📁 tests/                    # Test suite
│   ├── 📁 server/              # API tests
│   ├── 📁 integration/         # Integration tests
│   ├── 📁 middleware/          # Middleware tests
│   ├── 📁 utils/               # Utility tests
│   ├── 📁 scripts/             # Script tests
│   ├── 📁 fetcher/             # Fetcher tests
│   └── 📁 performance/         # Performance tests
├── 📁 utils/                    # Shared utilities
│   ├── file.js                 # File operations
│   └── logger.js               # Logging system
├── 📁 coverage/                # Test coverage reports
├── server.js                   # Main server file
├── package.json                # Dependencies & scripts
├── jest.config.js              # Jest configuration
└── README.md                   # Documentation
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

## 🔄 Data Flow

### **1. Fetch Process**
```
External API → fetcher/index.js → data/full-address.json
```

### **2. Import Process**
```
JSON File → scripts/importUnits.js → MongoDB
```

### **3. API Request Flow**
```
Client Request → Express Router → Controller → MongoDB/JSON → Response
```

### **4. Auto Sync Process**
```
Cron Job (3:00 AM) → fetcher/schedule.js → Update JSON → Sync MongoDB
```

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