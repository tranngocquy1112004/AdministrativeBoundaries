import mongoose from "mongoose";

const unitHistorySchema = new mongoose.Schema(
  {
    // 🆔 Mã đơn vị hành chính (VD: 00004, 79, 01005)
    code: {
      type: String,
      required: true,
      index: true,
    },

    // ⚙️ Loại hành động: cập nhật, xóa, khôi phục, tạo mới
    action: {
      type: String,
      enum: ["create", "update", "delete", "restore"],
      required: true,
    },

    // 🕓 Dữ liệu trước khi thay đổi
    oldData: {
      type: Object,
      default: null,
    },

    // 🆕 Dữ liệu sau khi thay đổi
    newData: {
      type: Object,
      default: null,
    },

    // 🧹 Đánh dấu trạng thái đã bị xóa (để dễ lọc log)
    deleted: {
      type: Boolean,
      default: false,
    },

    // 📅 Thời điểm thay đổi
    changedAt: {
      type: Date,
      default: Date.now,
    },

    // 👤 Người thực hiện (để mở rộng hệ thống quản trị sau này)
    changedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true, // thêm createdAt, updatedAt
    collection: "unit_histories", // tên collection rõ ràng
  }
);

// 🔍 Index tối ưu cho truy vấn nhanh
unitHistorySchema.index({ code: 1, changedAt: -1 });

export default mongoose.model("UnitHistory", unitHistorySchema);
