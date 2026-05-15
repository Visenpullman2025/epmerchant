/**
 * 前端临时映射：std_* 标准服务 code → 中文显示名。
 * 与 epbkend StandardServiceP1aSeeder 中的 13 项标准服务对齐。
 * 后端将 linkedService 项目化时（嵌套对象 {standardServiceCode, name_i18n}），
 * 此 map 可删除。
 *
 * 支持两种形态：完整 `std_*` code 与去前缀后的 suffix（`ac-cleaning` 等）。
 * 商家 capability 数据通常用 suffix，标准服务目录用完整 code。
 */
const SUFFIX_TO_ZH: Record<string, string> = {
  'house-measurement': '房屋测量',
  house_measurement: '房屋测量',
  'repair-water': '水路维修',
  'repair-electric': '电路维修',
  'repair-appliance': '家电维修',
  'pest-control': '防虫除害',
  'lawn-care': '草坪养护',
  'pool-cleaning': '泳池清洁',
  'pet-boarding': '宠物寄养',
  'pet-grooming': '宠物美容',
  'carpet-cleaning': '地毯清洁',
  'ac-cleaning': '空调清洁',
  'curtain-cleaning': '窗帘清洁',
  'sofa-cleaning': '沙发清洁',
  'home-cleaning': '家政深度清洁',
  // 与历史/别名兼容
  'aircon-cleaning-standard': '标准空调清洗',
  'home-cleaning-standard': '标准上门保洁',
};

const STD_SERVICE_NAMES_ZH: Record<string, string> = Object.fromEntries(
  Object.entries(SUFFIX_TO_ZH).flatMap(([suffix, zh]) => [
    [`std_${suffix}`, zh],
    [suffix, zh],
  ]),
);

export function getServiceNameZh(code?: string | null): string | null {
  if (!code) return null;
  const direct = STD_SERVICE_NAMES_ZH[code];
  if (direct) return direct;
  const suffix = code.replace(/^std_/, '');
  return SUFFIX_TO_ZH[suffix] ?? suffix.replace(/[-_]/g, ' ');
}
