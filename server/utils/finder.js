/** 
 * Xây dựng cây phân cấp hành chính từ danh sách phẳng
 * @param {Array} units - danh sách đơn vị hành chính
 * @returns {Array} cây phân cấp hành chính (province → district → commune)
 */
export function buildTree(units) {
  const map = {}; // Lưu tạm các đơn vị để truy cập nhanh
  const roots = []; // Danh sách các cấp cao nhất (tỉnh)

  // Tạo bản đồ tra cứu nhanh theo code
  for (const unit of units) {
    map[unit.code] = { ...unit, children: [] };
  }

  // Xây dựng quan hệ cha - con dựa trên parentCode
  for (const unit of units) {
    if (unit.parentCode && map[unit.parentCode]) {
      map[unit.parentCode].children.push(map[unit.code]);
    } else {
      // Nếu không có parentCode, mặc định là cấp cao nhất (tỉnh)
      roots.push(map[unit.code]);
    }
  }

  return roots;
}