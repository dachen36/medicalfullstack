import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { AdminManageAccountModal } from './components/AdminAccountSetting';

import { AccountSettingsModal, getAvatarSrc } from './components/AccountSetting'; // 引入上面创建的Modal
import type { AccountFormat, PatientCase } from './common/CommonInterface';


interface LandingPageProps {
  onSelectCase: (caseId: string) => void;
  onLogout: () => void; // 接住 App.tsx 传进来的登出函数
}


export default function LandingPage({ onSelectCase,onLogout }: LandingPageProps) {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');

  // 控制编辑/新增弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Partial<PatientCase> | null>(null);


  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // 控制 设置下拉菜单的显示/隐藏状态---点击账号旁边的设置


  const [showAdminManageAccountModal, setAdminManageAccountModal] = useState(false); //控制管理员 管理 账号 modal的显示


  const location = useLocation(); //navigate要求
  // 核心：通过 location.state 拿到传过来的数据
  const role = location.state?.role;           // 'user' 或 'admin'


  // 💡 用 useState 接收初始的 accountinfo，并获取 setAccountinfo 方法
  const [accountinfo, setAccountinfo] = useState<AccountFormat | undefined>(
    location.state?.accountinfo
  );


  // 1. 账号设置 Modal 显示的 state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // 保存修改的回调（模拟后端 API 请求 + 前端实时刷新）
  const handleSaveAccount = async (updatedData: { username: string; password?: string; avatarUrl: string }) => {
    try {
      console.log('提交给后端的数据：', { userId: accountinfo?.id, ...updatedData });
      
      // 1. 模拟后端 API 请求延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      // TODO: 真实对接后端时换成真正的 API 请求, 如 await updateUserInfo(updatedData)

      // 2. 更新前端状态，驱动页面实时刷新
      setAccountinfo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          username: updatedData.username,
          avatarUrl: updatedData.avatarUrl,
          ...(updatedData.password ? { password: updatedData.password } : {}),
        };
      });

    } catch (error) {
      console.error('保存失败：', error);
    }
  };


  // =========================================================
  // 📥 1. 【查】加载病历列表
  // =========================================================
  const fetchCasesFromDB = async () => {
    setIsLoading(true);
    try {
      const localData = localStorage.getItem('clinic_cases_v3');
      if (localData) {
        setCases(JSON.parse(localData));
      } else {
        // ！！！略去导入过程 样例数据
        const defaultCases: PatientCase[] = [
          {
            id:"123",
            name:"abc",
            gender:"男",
            age:80,
    "患者病例": "患者男，80岁，因“发热、咳嗽5d”于2014年7月22日入院。患者5d前无明显诱因出现发热，多于午后及夜间发热，最高达38.5℃，偶有咳嗽，无痰，自行口服头孢菌素等药物无效来诊。患者1年前因双下肢水肿、腰酸痛于我院诊断膜性肾病，来诊时口服醋酸泼尼松片30mg，1次/d及他克莫司1.0mg，2次/d治疗；并有高血压、糖尿病史，应用氨氯地平、二甲双胍、胰岛素治疗。",
    "症状体征": "入院时查体：体温37.3℃，血压100/60mmHg（1mmHg=0.133kPa），心率80次/min，呼吸18次/min。神清语明，平车推入病房，双肺呼吸音粗，可闻及散在干湿啰音；腹部稍膨隆，移动性浊音阳性，双下肢水肿，余未见明显异常。入院后第6天，患者体温再次升至38.5℃，出现明显呼吸困难，在吸氧10L/min时，监护示指脉氧饱和度仅60%。",
    "常规检查": "血常规白细胞4.6×10⁹/L，中性粒细胞4.12×10⁹/L，淋巴细胞0.43×10⁹/L；血红蛋白78g/L，血小板93×10⁹/L；血气分析（吸空气）：pH 7.494，PCO₂ 24mmHg，PO₂ 51.2mmHg；降钙素原0.964ng/ml；CRP 174mg/L；尿常规：白细胞23.91/μl，管型9.19/μl；24h尿蛋白定量1.04g；凝血五项：凝血酶原时间11.3s，D-二聚体2026μg/L；淋巴细胞绝对计数示：总T细胞217个/μl，抑制毒细胞T 77个/μl，辅助细胞T 137个/μl；肾功能：尿素11.79mmol/L，肌酐90.5mmol/L，钠离子143mmol/L，钾离子3.34mmol/L；肝功能：白蛋白13.1g/L，丙氨酸转氨酶、门冬氨酸转氨酶、胆红素、肌酸激酶未见异常；结核分枝杆菌、支原体、军团菌抗体阴性。",
    "病原学检查": "军团菌尿抗原阳性，呼吸道分泌物军团菌核酸阳性，军团菌培养阴性。",
    "影像学检查": "2014年7月23日肺部CT：右肺上叶实变影，左肺少许渗出影，右侧胸腔积液（图1A）；2014年7月27日床旁胸部X线片：示双肺多发渗出、实变影（图1B）。"
  },
  {
    id:"456",
    name:"def",
            gender:"男",
            age:58,
    "患者病例": "患者男性，58岁，因“呼吸困难16 h”于2020年12月23日14∶36入院。既往有糖尿病、高血压病史多年，从事电焊工作30余年，日均工作约6h。无长期口服激素、身患免疫、肿瘤疾病病史，无近期住院史。入院时患者喘息明显，未吸氧时外周氧饱和度仅80%，予高流量吸氧（氧流量20 L/min，氧浓度100%），外周氧饱和度勉强至90%。",
    "症状体征": "查体：体温38.8℃，脉搏137次/min，呼吸36次/min，血压114/67mmHg（1mmHg=0.133kPa）。肺部听诊双肺呼吸音稍低，并可闻及湿啰音。",
    "常规检查": "1.血气分析：pH值7.439，动脉二氧化碳分压（PaCO2）22.9 mmHg，动脉氧分压（PaO2）50.0mmHg，实际碳酸氢根水平15.5mmol/L，乳酸水平6.9mmol/L，钾离子浓度3.5mmol/L，钠离子浓度131mmol/L。2.肾功能：尿素水平13.04mmol/L，肌酐水平201.5mmol/L。3.凝血：凝血酶原时间14.5s，活化部分凝血活酶时间29.50s，纤维蛋白原水平4.4g/L。4. 血常规：白细胞计数3.70×109/L，中性粒细胞百分比58.34％，红细胞计数4.47×1012/L，血红蛋白浓度155g/L，血小板计数128×109/L。",
    "病原学检查": "12月25日：肺泡灌洗液宏基因检测结果：检出鲍曼不动杆菌，少量金黄色葡萄球菌。12月26日：初次痰培养结果：鲍曼复合群不动杆菌2+，亚胺培南敏感，MIC＜1μg/ml。12月27日：26日留取的痰培养结果：鲍曼复合群不动杆菌4+，亚胺培南敏感，MIC＜1μg/ml。12月29日：26号肺泡灌洗液结果回报：多耐药的鲍曼复合群不动杆菌＞105cfu，亚胺培南敏感耐药，多黏菌素B、替加环素敏感。",
    "影像学检查": "查胸部CT（图1）示：两肺炎症，左肺下叶实变。图1示肺窗及纵隔窗可见双肺炎症性改变，左侧为重，伴左肺下叶实变影，可见支气管充气征。"
  },
  {
    id:"789",
    name:"ghi",
            gender:"男",
            age:64,
    "患者病例": "患者男，64岁，农民，因“发热8 d”于2020年11月6日入院。发病前有“家禽”接触史。患者自诉8 d前无明显诱因出现畏寒、发热，自测最高体温39.5℃，伴有咳嗽、咯痰，咯少量黄白色黏液痰，伴有头晕，无头痛，无恶心、呕吐，无腹痛、腹泻。6 d前至某县医院就诊，考虑诊断为“肺部感染”，先后予以“头孢他啶、美罗培南+左氧氟沙星”抗感染治疗6 d，仍有反复发热，体温波动在38.0～39.0℃。患者为进一步诊治入我院。",
    "症状体征": "入院查体：体温38.7℃，脉搏118次/min，呼吸35次/min，血压118/78 mmHg，血氧饱和度88%（吸氧2 L/min)。唇无紫绀，左肺呼吸音粗，双下肺闻及明显湿性啰音，左肺为甚。心率118次/min，心律齐。",
    "常规检查": "血常规：白细胞6.17×109/L，中性粒细胞占比0.778；PCT 1.39 μg/L；CRP 175.82 mg/L；红细胞沉降率 68.4 mm/1 h。心肌酶谱：乳酸脱氢酶482.6 U/L，肌酸激酶557.0 U/L，肌酸激酶同功酶28.1 U/L，肌红蛋白145 μg/L；肝功能：白蛋白24.7 g/L，丙氨酸氨基转移酶64.1 U/L，天冬氨酸氨基转移酶151.1 U/L。血浆D-二聚体6.29 mg/L。血气分析结果：pH 7.48，PCO2 31 mmHg，PO2 67 mmHg，吸入氧浓度为29%。",
    "病原学检查": "支气管肺泡灌洗液二代测序结果提示：鹦鹉热衣原体。痰培养及血培养病原体均阴性。",
    "影像学检查": "11月6日胸部CT示：左肺大片实变阴影（图1）。2020年11月16日复查胸部CT示双下肺实变。2020年12月3日随访复查胸部CT示双肺病灶较前吸收好转（图2）。"
  },
  {
    id:"113",
    name:"jkl",
            gender:"男",
            age:38,
    "患者病例": "患者男，38岁，于2021年2月28日8时左右工作时误吸八氟异丁烯（持续约30min），当时无不适，夜间出现胸闷、气短、咳嗽、咳痰，痰为黄色泡沫样，上述症状逐渐加重至不能平卧，遂以“胸闷、气短伴咳嗽咳痰16h”于2021年3月1日凌晨就诊于内蒙古医科大学附属医院急诊科。患者既往体健，否认传染病及家族遗传病史，否认吸烟史。",
    "症状体征": "体温36℃，脉率121次/min，呼吸频率31次/min，血压132/79mmHg（1mmHg=0.133kPa）。发育正常，体型偏胖，神志清楚，自主体位，急性面容，体检合作。肺部双肺呼吸音粗，可闻及湿啰音，左肺为著，无胸膜摩擦音。心率121次/min，律齐，未闻及附加心音及杂音。余体检未见异常。",
    "常规检查": "2021年3月6日复查血常规：白细胞为12.70×10⁹/L，单核细胞比率为5.40%，中性粒细胞比率为85.00%。动脉血气分析（鼻导管吸氧状态，FiO₂为29%）：pH为7.40，PaCO₂为43mmHg，PaO₂为92mmHg，HCO₃⁻为27.3mmol/L，BE为1.1mmol/L，SO₂为94%。血常规：白细胞为16.92×10⁹/L，淋巴细胞比率为5.40%，单核细胞比率为1.60%，中性粒细胞比率为92.70%，嗜酸粒细胞比率为0.10%，血红蛋白为133g/L，血小板为198×10⁹/L。C反应蛋白为9.42mg/L。肌酸激酶为924U/L、肌酸激酶同工酶为60.2U/L。肌钙蛋白、脑钠肽、肝肾功、凝血常规等均无异常。",
    "病原学检查": "无",
    "影像学检查": "首次胸部CT（2021年3月1日16时，图1~3）双肺可见斑片状磨玻璃影，边界不清；双侧胸膜增厚并胸腔积液。2021年3月5日复查胸部CT（图4~6）右肺下叶可见条索状高密度影，右侧胸膜局限性增厚，界不清，应用糖皮质激素治疗5d后复查胸部CT可见斑片状磨玻璃影基本吸收。"
  },
  {
    id:"1223",
    name:"mno",
            gender:"男",
            age:58,
    "患者病例": "患者，男，58岁，主因“间断齿龈出血1年余，加重伴头晕1个月”人院。人院查体：生命体征平稳，神志清楚，轻度贫血貌，浅表淋巴结未触及肿大，心、肺未见异常，腹软，无压痛、反跳痛，肝、脾肋缘下未触及，双下肢无水肿。实验室检查：血常规：WBC 7.09×10°/L,HGB 98 g/L,PLT 217×10/L。血白蛋白29.9g/L,血β.微球蛋白1.9mg/L。凝血功能：APTT 51.2s。VWF:Ag 37.3?VⅢ:C43.6??IgM 111 g/L,IgM-x 1 113.000mg/L,IgM-λ2310mg/L,尿M蛋白k链阳性，骨髓细胞形态学检查见淋巴样浆细胞。骨髓细胞免疫分型：CD20B细胞占6.52表达c/m k,为克隆性B细胞；CD30stCD138细胞占0.12表达CD45、CD38、CD19、c/m k、CD138、CD20,为异常克隆性浆细胞。MYD88基因L265P突变阳性，定量为2.6??染色体核型；46,XY。确诊为WM。给予3次血浆置换，随后给予利妥昔单抗+CHOP(利妥昔单抗+环磷酰胺+长春新碱+吡柔比星+泼尼松)方案化疗，利妥昔单抗每个疗程用量为375 mg/m2。治疗2个疗程后患者齿龈出血停止、头晕好转。IgM降至50.5 g/L,HGB上升至109gL。复查骨髓细胞MYD88基因L265P突变转阴。第3次化疗结束后3d患者出现高热，体温最高39℃,同时伴有干咳、呼吸困难，双肺听诊闻及干啰音。",
    "症状体征": "生命体征平稳，神志清楚，轻度贫血貌，浅表淋巴结未触及肿大，心、肺未见异常，腹软，无压痛、反跳痛，肝、脾肋缘下未触及，双下肢无水肿。第3次化疗结束后3d患者出现高热，体温最高39℃,同时伴有干咳、呼吸困难，双肺听诊闻及干啰音。",
    "常规检查": "血常规：WBC 7.09×10°/L,HGB 98 g/L,PLT 217×10/L。血白蛋白29.9g/L,血β.微球蛋白1.9mg/L。凝血功能：APTT 51.2s。VWF:Ag 37.3?VⅢ:C43.6??IgM 111 g/L,IgM-x 1 113.000mg/L,IgM-λ2310mg/L,尿M蛋白k链阳性。骨髓细胞形态学检查见淋巴样浆细胞。骨髓细胞免疫分型：CD20B细胞占6.52表达c/m k,为克隆性B细胞；CD30stCD138细胞占0.12表达CD45、CD38、CD19、c/m k、CD138、CD20,为异常克隆性浆细胞。染色体核型：46,XY。",
    "病原学检查": "为排查患者间质性肺炎的病因，进行血培养、痰培养、自身抗体、抗中性粒细胞胞质抗体、类风湿因子和病毒检测，结果均为阴性，降钙素原正常。",
    "影像学检查": "胸部CT检查示双肺毛玻璃样改变(图1a)。肺功能检查显示限制性通气功能障碍，肺弥散功能减低。胸部CT复查示双肺毛玻璃样改变消失，双肺纹理恢复正常(图1b)。"
  },
  {
    id:"12223",
    name:"pqr",
            gender:"男",
            age:64,
    "患者病例": "患者男，64岁，因“发现血糖升高6年，纳差、乏力5 d”于2020年4月23日入院。患者于6年前发现血糖升高，完善相关检查后确诊为“2型糖尿病”，近期规律口服“盐酸吡格列酮片、二甲双胍缓释片”降糖治疗，自诉平素测空腹血糖波动在7~8mmol/L。5 d前无明显诱因出现纳差伴乏力，自行到当地社区医院就诊，服药对症治疗后患者症状无明显缓解，且开始出现厌油、排浓茶样尿，伴大腿部肌肉酸痛感，排糊状烂便，无明显恶心、呕吐，无腹痛，无皮肤黄染等不适，遂来我院门诊就诊，查随机血糖为25mmol/L，丙氨酸氨基转移酶（ALT）为94U/L、天冬氨酸氨基转移酶（AST）为444U/L，门急诊筛查新冠病毒核酸呈阴性后，以“糖尿病、肝损伤”收治内分泌科。患者发病以来，精神胃纳欠佳，睡眠一般，大小便如上述，体重无明显变化，体力较前下降。既往有高血压病史6年，近期规律口服“厄贝沙坦”降压治疗，平素血压控制可。从事保安工作，无烟酒等不良嗜好。",
    "症状体征": "入院体检：体温36.7℃，脉率121次/min，血压128/76mmHg（1mmHg=0.133kPa），呼吸频率18次/min，意识清楚，面色潮红，表情痛苦，全身浅表淋巴结无肿大，未见皮疹及出血点，口唇无发绀，颈软，双肺呼吸音清，未闻及明显干湿性啰音。心率121次/min，律齐，心音正常，各瓣膜听诊区未闻及杂音，腹软，无压痛及反跳痛，肝脾肋下未触及，双下肢无水肿。四肢肌力：双下肢肌力Ⅲ级，大腿肌肉酸痛、双下肢乏力，双上肢肌力正常。肌张力正常，病理反射未引出，生理反射存在。入院5 h后患者出现畏寒、高热，最高体温39.8℃，伴气促，尿少，排浓茶样尿。",
    "常规检查": "血常规：白细胞计数（WBC）为11.89×10^9/L，中性粒细胞百分比（NEUT%）占93.3%，淋巴细胞百分比占4.2%，血小板计数为91×10^9/L；血生化：钠为128.4mmol/L，氯化物为93.3mmol/L，总钙为1.96mmol/L，肌酐为96μmol/L；快速C反应蛋白（CRP）为>200mg/L；降钙素原（PCT）为4.88μg/L；红细胞沉降率（ESR）为94mm/1 h；肌红蛋白为>1 000μg/L，肌钙蛋白I为0.28μg/L；氨基末端B型利钠肽为14 024ng/L；CK为90 750U/L，肌酸激酶同工酶（CK-MB）为562U/L；尿常规：潜血3+，镜检红细胞+/HPF，尿蛋白3+，尿葡萄糖1+，尿酮体阴性。",
    "病原学检查": "肺泡灌洗液f及血标本宏基因组二代测序（mNGS）结果示：均检测到鹦鹉热衣原体。表1显示：BALF中检出鹦鹉热衣原体序列数1464，相对丰度72.12%；血标本中检出序列数2，相对丰度0.19%。补充追问病史，患者入院前1个月曾宰杀一只活鸭。",
    "影像学检查": "胸部CT提示双肺感染性病变，左肺下叶明显（图1~3）。入院第2天：气管分叉层面见双肺见多发斑片影，边界模糊（图1）；左主支气管中段层面见左肺下叶大片状密度增高影，部分肺叶实变（图2）；下肺层面见左肺下叶实变明显，右肺可见渗出病灶（图3）。5月11日复查胸部CT示双肺病灶较前吸收，右肺上叶新发少量感染（图4~6）。出院后1个月余复查胸部CT见双肺渗出已明显吸收（图7~9）。"
  },
  {
    id:"124443",
    name:"stu",
            gender:"男",
            age:37,
    "患者病例": "患者男性，37岁，藏族，牧民，主因“头痛10 d，发热、呼吸困难5 d”于2024年3月19日入院。患者10 d前出现头痛，以额部为主。5 d前出现发热，最高达39 ℃，伴呼吸困难，外院给予抗生素静脉滴注（具体不详），但呼吸困难加重。2 d前至急诊就诊，胸部CT提示双肺多发磨玻璃结节、渗出病变及实变，沿着支气管血管束分布（图1A~1D），纵隔淋巴结增大（图1E），头颅CT未见异常。既往体健，长居西藏浪卡子县（海拔4500 m）。现吸烟15包年，偶尔饮酒。有食用生肉史。2024年1月在露天牧场为牦牛接生。",
    "症状体征": "入院体检：体温36.4 ℃，脉率78次/min，呼吸频率28次/min，血压108/68 mmHg，双肺可闻及湿啰音，心、腹部未见异常，双下肢不肿。",
    "常规检查": "血常规提示白细胞计数、中性粒细胞计数增高（表1），淋巴细胞计数为0.45×10⁹/L，血红蛋白172 g/L，血小板205×10⁹/L。血生化提示丙氨酸转氨酶、天冬氨酸转氨酶及超敏C反应蛋白增高（表1）。入院实验室检查乳酸脱氢酶（LDH）为438 U/L（正常参考值：120~250 U/L），降钙素原升高（表1）。动脉血气分析提示pH为7.50，PaCO₂为28 mmHg（1 mmHg=0.133 kPa），PaO₂为39 mmHg（面罩吸氧8 L/min，拉萨，海拔3650 m）。",
    "病原学检查": "支气管肺泡灌洗液（BALF）的抗酸染色、Xpert MTB/RIF、细菌培养、真菌涂片、真菌PCR、呼吸道常见病原核酸均阴性。血培养、鼻咽拭子呼吸道病原PCR、痰抗酸染色、结核分枝杆菌及利福平耐药检测（Xpert MTB/RIF）均阴性。血液抗核抗体谱、抗中性粒细胞胞质抗体（ANCA）等免疫指标均阴性。入院第4天，BALF的靶向高通量测序（targeted high-throughput sequencing, tNGS）回报病原体仅为贝纳柯克斯体，均一化序列数为85，微生物估测浓度为5.6×10⁶/L。",
    "影像学检查": "胸部CT提示双肺多发磨玻璃结节、渗出病变及实变，沿着支气管血管束分布（图1A~1D），纵隔淋巴结增大（图1E）。2024年3月17日胸部CT可见双肺上叶类圆形磨玻璃结节（图1A，箭头），右肺上叶沿支气管血管束分布的实变（图1B，箭头），右肺中叶淡片状实变影（图1C，箭头），左肺下叶实变影（图1D，箭头），纵隔淋巴结增大，短径11.7 mm（图1E，箭头）。2024年4月25日胸部CT可见双肺渗出性病变明显吸收，双肺散在磨玻璃影（图3A~3D），纵隔淋巴结减小，短径7.8 mm（图3E，箭头）。"
  },

  {
    id:"334455",
    name:"vwx",
            gender:"女",
            age:58,
    "患者病例": "患者女，58岁，确诊抗合成酶综合征6个月，因咳喘、活动后气促加重1个月，胸部CT示肺间质病变较前加重，于2022年4月27日收入我院风湿免疫科。6个月前，患者出现咳嗽、喘憋、活动后气促，胸部CT示间质性肺炎，外院查抗组氨酰tRNA合成酶（histidyl tRNA synthetase, Jo-1）抗体、抗Ro-52抗体阳性，诊断为抗合成酶综合征，予甲泼尼龙（48mg口服、1次/d，每周减4mg）＋环磷酰胺（0.6g静脉滴注、2次/月）＋羟氯喹（200mg口服、2次/d）治疗后，喘憋、活动后气促症状有所缓解。1个月前，患者咳嗽、咳喘、活动后气促再次加重，胸部CT检查示间质性肺炎较前加重，加用抗感染药物（具体药物不详）治疗后略有缓解。8d前，外院胸部CT检查结果示双肺间质性肺炎，双肺胸膜增厚，为进一步治疗收入我院。患者17年前因多关节肿痛、喘憋、活动后气促（诊断不详），给予中成药（不详）及甲氨蝶呤（10mg口服、1次/周），关节肿胀消失，疼痛好转，用药2年后患者自行停药。患者患高血压病3年，规律服用氨氯地平5mg/d，收缩压维持在125~135mmHg（1mmHg=0.133kPa），舒张压维持在60~80mmHg。1年前患者出现双下肢水肿，血肌酐轻度升高（时高时低，具体数值不详），予托拉塞米（20mg口服、1次/d）治疗7d后缓解。患者无药物、食物过敏史，无烟酒嗜好。",
    "症状体征": "入院体检：体温36.4℃，心率82次/min，呼吸20次/min，血压120/80mmHg；体重63kg。神志清，精神可；双肺呼吸音粗，可闻及少量干湿性啰音，无胸膜摩擦音；腹部膨隆，无压痛及反跳痛，肝脾未触及，Murphy征阴性；肩、肘、腕、踝、右髋、右膝关节压痛，踝关节肿胀，指关节压痛。",
    "常规检查": "实验室检查：WBC 15.9×10⁹/L，中性粒细胞计数13.8×10⁹/L，C反应蛋白20.0mg/L。入院第2天实验室检查示WBC 10.5×10⁹/L，中性粒细胞计数8.7×10⁹/L，淋巴细胞计数0.96×10⁹/L，红细胞计数3.2×10¹²/L，血红蛋白101g/L，空腹血糖3.6mmol/L，高密度脂蛋白胆固醇0.82mmol/L，乳酸脱氢酶304U/L，血钾3.3mmol/L，血氯116mmol/L，C反应蛋白21.3mg/L（参考值：<10.0mg/L），纤维蛋白原4.18g/L，D-二聚体0.96mg/L，B型利钠肽175ng/L，血清骨胶素21-1。CD3⁺ T细胞绝对计数591/μl（参考值：955~2860/μl），CD3⁺CD4⁺ T细胞绝对计数392/μl（参考值：441~2156/μl）。癌胚抗原9.28μg/L（<5.19μg/L），类风湿因子73kU/L，抗Jo-1抗体阳性（滴度156kRU/L），抗环状瓜氨酸多肽抗体373kU/L（参考值：<20kU/L）。",
    "病原学检查": "入院第3天，患者行纤维支气管镜检查、支气管肺泡灌洗液细胞学检查结果未见明显异常。入院第15天，考虑耶氏肺孢子菌肺炎。",
    "影像学检查": "8d前外院胸部CT示双肺间质性肺炎，双肺胸膜增厚。入院后胸部CT示肺间质病变较前加重。入院第15天胸部CT检查示双肺胸膜下网格影、斑片影。入院第20天胸部CT检查示颈部及纵隔气肿。入院第27天，纵隔气肿较前明显缓解。"
  },

        ];
        localStorage.setItem('clinic_cases_v3', JSON.stringify(defaultCases));
        setCases(defaultCases);
      }
    } catch (err) {
      console.error("加载病例失败", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesFromDB();
  }, []);

  // =========================================================
  // 💾 2. 【增 / 改】保存或更新（直接操作中文键名）
  // =========================================================
  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase?.["患者病例"]) return alert('请填写患者病例基本信息');

    const isEdit = !!editingCase.id;
    const nowStr = new Date().toLocaleString();

    try {
      if (isEdit) {
        const updated = cases.map(c => 
          c.id === editingCase.id 
            ? { ...c, ...editingCase, updatedAt: nowStr } as PatientCase 
            : c
        );
        setCases(updated);
        localStorage.setItem('clinic_cases_v3', JSON.stringify(updated));
      } else {
        const newCase: PatientCase = {
        // 1. 基础标识与状态
        id: `case-${Date.now()}`, // 自动生成前端 key
        status: 'pending',
        updatedAt: nowStr,

        // 2. 核心基本信息
        name: editingCase.name || '',
        gender: editingCase.gender || '未知',
        age: editingCase.age || 0,

        // 3. 病历诊断内容 (对应刚才表格里的 `c.caseSummary` 或 `c["患者病例"]`)
        "患者病例": editingCase["患者病例"] || '',

        // 4. 等级
        level: editingCase.level || '待分析',

        // 5. 💡【可选保留】如果你以后还要在“详情弹窗”里看这些检查，可以保留；如果彻底不要了，就直接删掉下面这几行
        "症状体征": editingCase["症状体征"] || '',
        "常规检查": editingCase["常规检查"] || '',
        "病原学检查": editingCase["病原学检查"] || '',
        "影像学检查": editingCase["影像学检查"] || '',
      };
        const updated = [newCase, ...cases];
        setCases(updated);
        localStorage.setItem('clinic_cases_v3', JSON.stringify(updated));
      }
      setIsModalOpen(false);
      setEditingCase(null);
    } catch (err) {
      alert('保存失败');
      
    }
  };

  // =========================================================
  // 🗑️ 3. 【删】删除指定病例
  // =========================================================
  const handleDeleteCase = (id: string, _name: string) => {
    if (!window.confirm(`确定要删除此病历档案吗？`)) return;
    try {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      localStorage.setItem('clinic_cases_v3', JSON.stringify(updated));
    } catch (err) {
      alert('删除失败');
    }
  };

  const filteredCases = cases.filter(c => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true; // 没有输入搜索词，默认展示全部

    // 1. 精确匹配：输入的词跟 ID 或 姓名 完全对上
    const isExactMatch = 
      (c.id?.toString() || '').toLowerCase() === query || 
      (c.name || '').toLowerCase() === query;

    // 2. 模糊匹配：输入的词包含在病历文本中
    const isFuzzyMatch = 
      (c["患者病例"] || '').includes(query);

    return isExactMatch || isFuzzyMatch;
  });



  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col font-sans">
      
      {/* 头部导航与标题 */}
      <div className="flex justify-between items-center mb-6">
        
        {/* 左侧：标题与说明 */}
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🏥</span> 智能临床分析工作台
          </h1>
          <p className="text-xs text-slate-500 mt-1">数据接口直接映射 5 列指标，进入 AI 深度特征推导与辅助诊疗系统</p>
        </div>
        
        {/* 右侧：用户信息、设置按钮与退出按钮 */}
        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-2">
            {/* 头像 */}
            <img
              src={getAvatarSrc(accountinfo?.avatarUrl)}
              alt="头像"
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />

            {/* 原有逻辑与文字 */}
            <p className="text-xs font-medium text-slate-600">
              当前登录身份: <span className="text-indigo-600 font-bold">{role}</span> 
              | 当前用户名: <span className="text-slate-800 font-bold">{accountinfo?.username}</span>
              | 当前等级: <span className="text-slate-800 font-bold">{accountinfo?.rank}</span>
            </p>
          </div>

          {/* ⚙️ 设置按钮 & 下拉菜单容器 */}
          <div className="relative">
            <button 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              设置
            </button>

            {/* 下拉菜单面板：根据 role 条件渲染不同的选项 */}
            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                
                {/* 选项 1：所有角色都有 —— 修改账号 */}
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setIsAccountModalOpen(true); // 👈 打开弹窗
                    //alert(`点击了：修改账号 (当前用户ID: ${accountinfo?.id})`);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  修改账号
                </button>

                {/* 选项 2：条件渲染 —— 只有 admin (管理员) 才能看到的管理账号 */}
                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false); //关闭 点击“设置”的 下拉弹窗
                      //alert('进入管理员专属：管理账号面板');
                      // TODO: 在这里打开你写好的“管理账号面板/弹窗”
                      setAdminManageAccountModal(true); // 👈 点击后打开弹窗
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors border-t border-slate-100"
                  >
                    管理账号
                  </button>
                )}

              </div>
            )}
          </div>
          
          {/* 退出登录按钮 */}
          <button 
            onClick={onLogout} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>

        

      </div>

      {/* 指标看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="text-slate-400 text-xs font-bold uppercase">总管理病历数</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{cases.length} <span className="text-xs font-normal text-slate-500">例</span></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="text-red-500 text-xs font-bold uppercase">🔴 高危病历</div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {cases.filter(c => c.level === '高危').length} <span className="text-xs font-normal text-slate-500">例</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="text-amber-500 text-xs font-bold uppercase">🟡 待分析病历</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {cases.filter(c => c.status === 'pending').length} <span className="text-xs font-normal text-slate-500">例</span>
          </div>
        </div>
      </div>

      {/* 搜索过滤控制栏 */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="搜索患者姓名/基本信息/描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs outline-none focus:border-blue-500 transition-colors bg-slate-50"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          {['ALL', '待分析', '低危', '中危', '高危'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                filterLevel === lvl 
                  ? 'bg-slate-800 text-white border-slate-800' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lvl === 'ALL' ? '全部级别' : lvl}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditingCase({ 
              "患者病例": '',
              "症状体征": '',
              "常规检查": '',
              "病原学检查": '',
              "影像学检查": '',
              level: '待分析'
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>➕</span> 新建患者病例
        </button>


      </div>





      {/* 数据列表容器：限制最大高度，超出自动出现纵向滚动条；宽度超出自动出现横向滚动条 */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-slate-400">正在加载数据...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">暂无符合条件的病例数据</div>
        ) : (
          
          /* 🎯 关键改动：加了 max-h-[65vh] 和 overflow-y-auto，并美化了滚动条样式 */
          <div className="w-full max-h-[65vh] overflow-x-auto overflow-y-auto rounded-lg border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              {/* 🎯 保持表头吸顶固定 */}
              <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                <tr className="text-slate-500 font-bold bg-slate-50/50">
                  <th className="p-3.5 w-[12%]">ID</th>
                  <th className="p-3.5 w-[12%]">姓名</th>
                  <th className="p-3.5 w-[8%]">性别</th>
                  <th className="p-3.5 w-[8%]">年龄</th>
                  <th className="p-3.5 w-[35%]">病历</th>
                  <th className="p-3.5 w-[13%]">最近更新</th>
                  {/* 操作列固定在右侧 */}
                  <th className="p-3.5 w-[12%] text-right sticky right-0 bg-slate-50/90 backdrop-blur-xs">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* 1. ID */}
                    <td className="p-3.5 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {c.id}
                        </span>
                        {c.level && (
                          <span className="self-start px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-100">
                            {c.level}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. 姓名 */}
                    <td className="p-3.5 font-bold text-slate-800 align-top">
                      {c.name || '未登记'}
                    </td>

                    {/* 3. 性别 */}
                    <td className="p-3.5 text-slate-600 align-top">
                      {c.gender || '-'}
                    </td>

                    {/* 4. 年龄 */}
                    <td className="p-3.5 text-slate-600 align-top">
                      {c.age ? `${c.age} 岁` : '-'}
                    </td>

                    {/* 5. 病历（限制最大高度 + 允许局部滚动） */}
                    <td className="p-3.5 align-top">
                      <div 
                        className="
                          text-xs text-slate-600 
                          max-h-[36px]              /* 平时高度：约2行 */
                          hover:max-h-[120px]       /* 悬浮高度：瞬间撑大到约6-7行，方便滚动 */
                          leading-tight 
                          break-all 
                          overflow-hidden           /* 默认隐藏 */
                          line-clamp-2              /* 默认显示省略号 */
                          hover:line-clamp-none     /* 悬浮时显示全文 */
                          hover:overflow-y-auto     /* 悬浮时显示滚动条 */
                          scrollbar-thin 
                          scrollbar-thumb-slate-200 
                          transition-all duration-300 ease-in-out /* 增加一点动画过渡 */
                        "
                      >
                        {c["患者病例"] || '暂无病历记录'}
                      </div>
                    </td>

                    {/* 6. 最近更新 */}
                    <td className="p-3.5 text-xs text-slate-400 font-mono align-top">
                      {c.updatedAt || '刚刚'}
                    </td>

                    {/* 7. 操作列（固定在最右侧，背景加白防遮挡） */}
                    <td className="p-3 align-top text-right sticky right-0 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col gap-1.5">
                        {/* 进入病历：高亮强调 */}
                        <button 
                          onClick={() => onSelectCase(c.id)}
                          className="w-full px-2 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-[11px] font-bold transition-all"
                        >
                          进入病历
                        </button>
                        
                        {/* 编辑与删除：轻量化处理 */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => { setEditingCase(c); setIsModalOpen(true); }}
                            className="w-full bg-slate-400 hover:bg-slate-600 text-slate-300 py-1 rounded text-[10px] font-medium transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteCase(c.id, c["患者病例"] || '')}
                            className="w-full bg-red-400 hover:bg-red-600 text-neutral-50 py-1 rounded text-[10px] font-medium transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        )}
      </div>




      {/* 4. 【增/改】病例弹窗表单 (加入核心基础信息字段) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* 头部 */}
            <div className="flex justify-between items-center border-b border-slate-100 px-5 py-3.5 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCase?.id ? '📝 编辑患者病例' : '➕ 新建患者病例'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingCase(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            {/* 表单内容区（加 overflow-y-auto 防止小屏幕下按钮被盖住） */}
            <form onSubmit={handleSaveCase} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              
              {/* 新增：患者核心基本信息 (并排展示，节省空间) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingCase?.name || ''}
                    onChange={(e) => setEditingCase({ ...editingCase, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500"
                    placeholder="例：张伟"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">性别 <span className="text-red-500">*</span></label>
                  <select
                    value={editingCase?.gender || '男'}
                    onChange={(e) => setEditingCase({ ...editingCase, gender: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="未知">未知</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">年龄 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={150}
                    // 解决 TS 类型冲突：转为字符串显示，若不存在则为空字符
                    value={editingCase?.age !== undefined ? editingCase.age : ''}
                    // 提交时转为数字，若为空则设为 undefined，完美避开 TS 报错
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingCase({ 
                        ...editingCase, 
                        age: val === '' ? undefined : Number(val) 
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500"
                    placeholder="例：58"
                  />
                </div>
              </div>

              {/* 1. 患者病例 (原大类，现作为病历详细描述) */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">1. 患者病例 (详细说明) <span className="text-red-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  value={editingCase?.["患者病例"] || ''}
                  onChange={(e) => setEditingCase({ 
                    ...editingCase, 
                    "患者病例": e.target.value,
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 resize-none"
                  placeholder="请输入患者的详细病历诊断情况..."
                />
              </div>

              {/* 2. 症状体征 */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">2. 症状体征</label>
                <textarea
                  rows={2}
                  value={editingCase?.["症状体征"] || ''}
                  onChange={(e) => setEditingCase({ ...editingCase, "症状体征": e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 resize-none"
                  placeholder="例：持续发热、畏寒、咳嗽、胸闷..."
                />
              </div>

              {/* 3. 常规检查 */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">3. 常规检查</label>
                <textarea
                  rows={2}
                  value={editingCase?.["常规检查"] || ''}
                  onChange={(e) => setEditingCase({ ...editingCase, "常规检查": e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 resize-none"
                  placeholder="例：红细胞计数 2.9 (偏低)，白细胞 11.2..."
                />
              </div>

              {/* 4. 病原学检查 */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">4. 病原学检查</label>
                <textarea
                  rows={1.5}
                  value={editingCase?.["病原学检查"] || ''}
                  onChange={(e) => setEditingCase({ ...editingCase, "病原学检查": e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 resize-none"
                  placeholder="例：流感检测（阴性），痰培养..."
                />
              </div>

              {/* 5. 影像学检查 */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">5. 影像学检查</label>
                <textarea
                  rows={2}
                  value={editingCase?.["影像学检查"] || ''}
                  onChange={(e) => setEditingCase({ ...editingCase, "影像学检查": e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 resize-none"
                  placeholder="例：胸部CT显示双肺散在毛玻璃阴影..."
                />
              </div>

              {/* 警报级别 */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">警报级别</label>
                <select
                  value={editingCase?.level || '待分析'}
                  onChange={(e) => setEditingCase({ ...editingCase, level: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="待分析">待分析</option>
                  <option value="低危">低危</option>
                  <option value="中危">中危</option>
                  <option value="高危">高危</option>
                </select>
              </div>

              {/* 底部操作按钮 */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingCase(null); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 渲染 管理员 管理账号 modal */}
      <AdminManageAccountModal isOpen={showAdminManageAccountModal} onClose={() => setAdminManageAccountModal(false)} />

      {/* 渲染 账号设置 Modal */}
      <AccountSettingsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={accountinfo}
        onSave={handleSaveAccount}
      />


    </div>
  );
}