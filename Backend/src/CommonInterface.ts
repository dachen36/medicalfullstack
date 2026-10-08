//与前端的CommonInterface.ts 保持一致 统一接口
// 直接从前端那复制这个ts 过来 或者 全选拷贝过来

// =========================================================================================
// 🚨【 跨端数据契约警示 / CONTRACT WARNING 】🚨
// -----------------------------------------------------------------------------------------
// 1. 本文件中的接口必须与前端接收类型保持绝对一致！
// 2. 如果修改了字段名称（如 name -> label），会导致前端 Vue/React 卡片数据渲染为空！
// =========================================================================================

export interface AccountFormat { //账号的统一格式
  id: string;        // 字符串形式的纯数字 ID
  username: string;  // 姓名/显示名
  password: string;  // 密码
  rank: string;      // 默认 'doctor'
  avatarUrl?: string; // 👈 加上这行，用于存头像
}

// 🎯 1. 彻底简化！直接对齐后端 Landing Page 接口的 5 个中文键名
export interface PatientCase { //病历的统一格式
  id: string; // 仅保留 id 供 React 渲染和一键分析定位使用
  name: string;
  gender:string;
  age:number;
  "患者病例": string;
  updatedAt?: string; //最近更新


  // 完美对应你的 5 列数据结构
  //其余都是可选项
  "症状体征"?: string;
  "常规检查"?: string;
  "病原学检查"?: string;
  "影像学检查"?: string;

  // 业务状态字段（如果接口没返回，前端初始化时会自动补全）
  level?: string;                  // 警报等级：待分析、低危、中危、高危
  status?: 'pending' | 'analyzed'; // 分析状态
  
}

//基础信息及定性指标panel 卡片式    数据规范接口 id+label  
export interface MetricTag { //定性卡片的统一格式
  id: string;
  label: string;
}

//数值化定量指标 及 病原体检测  病理检测(金标准)   数据规范接口
export interface QuantitativeMetric { //定量卡片的统一格式
  id: string;
  name: string;
  value: string;
  unit?: string;
  isGoldStandard?: boolean; // 是否为金标准/病理检测
}



// 审计查询的数据格式？？？
export interface AuditQuery {
  page?: string | number
  pageSize?: string | number
  username?: string
  action?: string
}