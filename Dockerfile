FROM node:18-alpine

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json trước để tận dụng cache Docker
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --only=production

# Sao chép toàn bộ mã nguồn
COPY . .

# Mở port 3000 (hoặc port trong .env)
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]
