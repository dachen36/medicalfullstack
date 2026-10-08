import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { imageSize } from "image-size"; // ✅ ESM 方式正确导入
import { MetricTag, QuantitativeMetric } from "../CommonInterface";


export class OcrService {
  private ocrProcess: ChildProcess | null = null;
  private isReady = false;

  constructor() {
    this.initProcess();
  }

  private initProcess() {
    const exeDir = path.join(process.cwd(), "bin", "PaddleOCR-json");
    const exePath = path.join(exeDir, "PaddleOCR-json.exe");

    if (!fs.existsSync(exePath)) {
      console.error(`[OCR] ❌ 找不到 OCR 执行文件: ${exePath}`);
      return;
    }

    // 启动常驻 C++ 子进程
    this.ocrProcess = spawn(exePath, ["--ensure_ascii=1"], {
      cwd: exeDir, // 指定工作目录
      windowsHide: true,
    });

    // 1. 监听 stderr 输出
    this.ocrProcess.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString();
      if (msg.includes("OCR init completed")) {
        this.isReady = true;
        console.log("🚀 [OCR Engine] C++ 引擎完全就绪，随时可以传图！");
      }
    });

    // 2. 进程退出监听
    this.ocrProcess.on("exit", (code) => {
      console.warn(`⚠️ [OCR Engine] 子进程已退出，代码: ${code}`);
      this.isReady = false;
      this.ocrProcess = null;
    });
  }

  /**
   * 传入图片 Buffer 解析（只管底层的文字和坐标解析）
   */
  public async parseImage(imageBuffer: Buffer): Promise<any> {
    if (!this.ocrProcess || !this.ocrProcess.stdin) {
      throw new Error("OCR 子进程未就绪");
    }

    // 1. 获取图片尺寸（算百分比坐标）
    const dimensions = imageSize(imageBuffer);
    if (!dimensions || !dimensions.width || !dimensions.height) {
      throw new Error("解析图片尺寸失败，请检查上传的文件是否为有效图片");
    }
    const img_w = dimensions.width;
    const img_h = dimensions.height;

    // 2. 写入临时图片（带时间戳防止并发文件名冲突）

    //？？TODO : 图片格式转换？？？？
    const tempFileName = `temp_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
    const tempPath = path.join(process.cwd(), tempFileName);
    await Bun.write(tempPath, imageBuffer);

    return new Promise((resolve, reject) => {
      const reqPayload = JSON.stringify({ image_path: tempPath }) + "\n";

      // 定义 stdout 数据监听器
      const onData = (data: Buffer) => {
        try {
          const rawStr = data.toString().trim();
          const res = JSON.parse(rawStr);

          let outputResult: any;

          if (res.code === 100) {
            const fullTextList: string[] = [];
            const blocks = res.data.map((item: any) => {
              fullTextList.push(item.text);

              const box = item.box;
              const xs = box.map((pt: number[]) => pt[0]);
              const ys = box.map((pt: number[]) => pt[1]);
              const x_min = Math.min(...xs);
              const y_min = Math.min(...ys);
              const box_w = Math.max(...xs) - x_min;
              const box_h = Math.max(...ys) - y_min;

              return {
                text: item.text,
                score: item.score,
                box_percent: {
                  left: Number(((x_min / img_w) * 100).toFixed(2)),
                  top: Number(((y_min / img_h) * 100).toFixed(2)),
                  width: Number(((box_w / img_w) * 100).toFixed(2)),
                  height: Number(((box_h / img_h) * 100).toFixed(2)),
                },
              };
            });

            outputResult = {
              text: fullTextList.join(" "),
              blocks: blocks,
            };
          } else {
            outputResult = { text: "未识别到文字", blocks: [] };
          }

          // 控制台格式化输出 OCR 识别结果
          console.log("\n================ [OCR 识别结果] ================");
          console.log(JSON.stringify(outputResult, null, 2));
          console.log("================================================\n");

          // 解绑 stdout 监听
          this.ocrProcess?.stdout?.off("data", onData);
          // 异步清理临时文件
          fs.unlink(tempPath, () => {});

          resolve(outputResult);
        } catch (e) {
          // 如果解析 JSON 失败（可能收到非 JSON 的普通日志），忽略继续等待完整数据
        }
      };

      this.ocrProcess!.stdout!.on("data", onData);
      // 向子进程 stdin 发送文件路径命令
      this.ocrProcess!.stdin!.write(reqPayload);
    });
  }

  // =========================================================================================
  //  SECTION: 医疗数据结构化提取函数集合（保留不同演进版本，按需调用）
  // =========================================================================================

  /**
   * ⚡【最新推荐主用版本】extractMedicalData (增强版)
   * ---------------------------------------------------------------------------------------
   * 功能说明：基于行块 (Blocks) 逐行扫描生命体征与诊断，辅以高频词库匹配 + 行切片保底机制。
   * 数据契约：
   *  - quantitativeData: QuantitativeMetric[] (包含 id, name, value, unit)
   *  - qualitativeData: QuantitativeMetric[] (后端保留 name/value 格式，若传给前端卡片需做 label 转换)
   */
  public extractMedicalData(parseResult: { text: string; blocks: Array<{ text: string }> }) {
    const blocks = parseResult?.blocks || [];
    const fullText = (parseResult?.text || blocks.map(b => b.text).join('\n') || '').trim();

    console.log('[DEBUG OCR Text length]:', fullText.length);

    // 1. 明确声明数组类型，直接使用开头定义的接口
    const quantitativeData: QuantitativeMetric[] = [];
    const qualitativeData: MetricTag[] = [];

    let quantCount = 0;
    let qualCount = 0;

    // 2. 定量指标推流：严格符合 QuantitativeMetric 接口 ({ id, name, value, unit })
    const addQuant = (name: string, value: any, unit = '') => {
      quantitativeData.push({
        id: `quant-${quantCount++}-${Date.now()}`,
        name,
        value: String(value),
        unit,
      });
    };

    // 3. 定性指标推流：严格符合 MetricTag 接口 ({ id, label })
    const addQual = (name: string, value: string) => {
      if (!value) return;
      const cleanVal = value.trim();
      // 直接组装成前端 Card/Tag 要求的 label 格式
      const displayLabel = name ? `${name}: ${cleanVal}` : cleanVal;

      // 查重并推入符合 MetricTag 接口的数据
      if (!qualitativeData.some(item => item.label === displayLabel)) {
        qualitativeData.push({
          id: `qual-${qualCount++}-${Date.now()}`,
          label: displayLabel, // 👈 完美契合 MetricTag 接口要求
        });
      }
    };

    // 1. 逐行解析 blocks 数组
    for (const block of blocks) {
      if (!block || !block.text) continue;
      const rawLine = block.text.trim();
      const line = rawLine.replace(/[\s\t]+/g, ''); // 压缩空格

      // --- A. 解析连体生命体征 ---
      if (line.includes('T3') || line.includes('T4') || line.includes('P1') || line.includes('BP') || line.includes('体温')) {
        const tMatch = line.match(/T\s*([34]\d(?:\.\d)?)/i);
        if (tMatch) addQuant('体温', parseFloat(tMatch[1]), '℃');

        const pMatch = line.match(/P\s*(\d{2,3})/i);
        if (pMatch) addQuant('心率/脉搏', parseInt(pMatch[1], 10), '次/分');

        const rMatch = line.match(/R\s*(\d{1,2})/i);
        if (rMatch) addQuant('呼吸', parseInt(rMatch[1], 10), '次/分');

        if (line.includes('BP未测出')) addQuant('血压', '未测出');
        else {
          const bpMatch = line.match(/BP[:：]?(\d{2,3}\/\d{2,3})/i);
          if (bpMatch) addQuant('血压', bpMatch[1], 'mmHg');
        }

        if (line.includes('SPO2:未测出') || line.includes('SPO2未测出')) {
          addQuant('血氧饱和度', '未测出');
        } else {
          const spo2Match = line.match(/SPO2[:：]?(\d{1,3}%?)/i);
          if (spo2Match) addQuant('血氧饱和度', spo2Match[1], '%');
        }
      }

      // --- B. 独立心率变化 ---
      if (line.includes('心率')) {
        const dropMatch = line.match(/心率(?:下降至|为)?(\d{2,3})次\/分/);
        if (dropMatch) addQuant('突发心率下降', parseInt(dropMatch[1], 10), '次/分');
      }

      // --- C. 血气分析 ---
      if (line.includes('PH') || line.includes('二氧化碳分压') || line.includes('氧分压')) {
        const phMatch = line.match(/PH\s*([<>]?\s*\d+(?:\.\d+)?)/i);
        if (phMatch) addQuant('血气-PH', phMatch[1]);

        const co2Match = line.match(/二氧化碳分压\s*(\d+(?:\.\d+)?)/);
        if (co2Match) addQuant('二氧化碳分压', parseFloat(co2Match[1]), 'mmHg');

        const o2Match = line.match(/氧分压\s*(\d+(?:\.\d+)?)/);
        if (o2Match) addQuant('氧分压', parseFloat(o2Match[1]), 'mmHg');
      }

      // --- D. 初步诊断/诊断 (加强容错匹配) ---
      if (/诊断/i.test(line)) {
        const dxParts = rawLine.split(/[:：]/);
        if (dxParts.length > 1 && dxParts[1].trim()) {
          addQual('初步诊断', dxParts[1].trim());
        }
      }

      // --- E. 主诉/查体段落卡片抓取 ---
      if (/主诉|现病史|查体|处置/i.test(line)) {
        const parts = rawLine.split(/[:：]/);
        if (parts.length > 1 && parts[1].trim()) {
          addQual(parts[0].trim(), parts[1].trim());
        }
      }
    }

    // 2. 全局高频医学词汇泛化打靶
    const medicalDict = [
      { reg: /呼之不应|无反应|不省人事/, name: '意识状态', value: '呼之不应' },
      { reg: /意识不清|神志不清|昏迷|谵妄/, name: '意识状态', value: '意识不清/昏迷' },
      { reg: /口吐白沫|吐沫/, name: '伴随症状', value: '口吐白沫' },
      { reg: /呕吐|恶心/, name: '伴随症状', value: '呕吐' },
      { reg: /紫绀|发绀|口唇发绀|口唇紫/, name: '体征', value: '口唇紫绀' },
      { reg: /干啰音|湿啰音|啰音/, name: '肺部听诊', value: '肺部啰音' },
      { reg: /心音低钝|心率齐|心律不齐/, name: '心脏听诊', value: '心音异常/低钝' },
      { reg: /气管插管/, name: '抢救处置', value: '气管插管' },
      { reg: /心肺复苏|CPR/, name: '急救处置', value: '心肺复苏(CPR)' },
      { reg: /呼吸机/, name: '抢救处置', value: '呼吸机辅助呼吸' },
      { reg: /除颤/, name: '急救处置', value: '电除颤' },
      { reg: /酸中毒/, name: '初步诊断', value: '酸中毒' },
      { reg: /呼吸衰竭/, name: '初步诊断', value: '呼吸衰竭' },
      { reg: /肺炎/, name: '初步诊断', value: '肺炎/两肺炎症' }
    ];

    medicalDict.forEach(item => {
      if (item.reg.test(fullText)) {
        addQual(item.name, item.value);
      }
    });

    // 3. 保底机制：若定性为空启动文本切片
    if (qualitativeData.length === 0 && fullText.length > 0) {
      console.warn('[OCR Warning] 定性正则未命中，启动文本切片保底');
      const lines = fullText.split(/[\n;\r。]/).map(l => l.trim()).filter(l => l.length > 2 && l.length < 30);
      lines.slice(0, 5).forEach(l => {
        if (!/\d{2,}/.test(l)) {
          addQual('病历摘要', l);
        }
      });
    }

    console.log('[DEBUG Extract Result]:', {
      quantCount: quantitativeData.length,
      qualCount: qualitativeData.length,
    });

    return {
      qualitativeData,
      quantitativeData,
    };
  }

  /**
   * 📦【备用历史版本】extractMedicalData2
   * ---------------------------------------------------------------------------------------
   * 功能说明：纯 Block 逻辑的轻量结构化提取版本，逻辑较清爽，用于简单的表格/连体数据抓取。
   */
  public extractMedicalData2(parseResult: { text: string; blocks: Array<{ text: string }> }) {
    const blocks = parseResult?.blocks || [];
    const fullText = parseResult?.text || '';

    const quantitativeData: QuantitativeMetric[] = [];
    const qualitativeData: QuantitativeMetric[] = [];

    let quantCount = 0;
    let qualCount = 0;

    const addQuant = (name: string, value: any, unit = '') => {
      quantitativeData.push({
        id: `quant-${quantCount++}-${Date.now()}`,
        name,
        value: String(value),
        unit,
      });
    };

    const addQual = (name: string, value: string) => {
      qualitativeData.push({
        id: `qual-${qualCount++}-${Date.now()}`,
        name,
        value,
      });
    };

    for (const block of blocks) {
      const line = block.text.replace(/[\s\t]+/g, '');

      if (line.includes('T3') || line.includes('T4') || line.includes('P1') || line.includes('BP')) {
        const tMatch = line.match(/T\s*([34]\d(?:\.\d)?)/i);
        if (tMatch) addQuant('体温', parseFloat(tMatch[1]), '℃');

        const pMatch = line.match(/P\s*(\d{2,3})/i);
        if (pMatch) addQuant('心率/脉搏', parseInt(pMatch[1], 10), '次/分');

        const rMatch = line.match(/R\s*(\d{1,2})/i);
        if (rMatch) addQuant('呼吸', parseInt(rMatch[1], 10), '次/分');

        if (line.includes('BP未测出')) addQuant('血压', '未测出');
        else {
          const bpMatch = line.match(/BP[:：]?(\d{2,3}\/\d{2,3})/i);
          if (bpMatch) addQuant('血压', bpMatch[1], 'mmHg');
        }

        if (line.includes('SPO2:未测出') || line.includes('SPO2未测出')) {
          addQuant('血氧饱和度', '未测出');
        } else {
          const spo2Match = line.match(/SPO2[:：]?(\d{1,3}%?)/i);
          if (spo2Match) addQuant('血氧饱和度', spo2Match[1], '%');
        }
      }

      if (line.includes('心率下降至')) {
        const dropMatch = line.match(/心率下降至(\d{2,3})次\/分/);
        if (dropMatch) addQuant('突发心率下降', parseInt(dropMatch[1], 10), '次/分');
      }

      if (line.includes('血气分析PH') || line.includes('二氧化碳分压')) {
        const phMatch = line.match(/PH\s*([<>]?\s*\d+(?:\.\d+)?)/i);
        if (phMatch) addQuant('血气-PH', phMatch[1]);

        const co2Match = line.match(/二氧化碳分压\s*(\d+(?:\.\d+)?)/);
        if (co2Match) addQuant('二氧化碳分压', parseFloat(co2Match[1]), 'mmHg');

        const o2Match = line.match(/氧分压\s*(\d+(?:\.\d+)?)/);
        if (o2Match) addQuant('氧分压', parseFloat(o2Match[1]), 'mmHg');
      }

      if (line.startsWith('初步诊断：') || line.startsWith('初步诊断:')) {
        const dxText = line.replace(/^初步诊断[:：]/, '');
        const dxList = dxText.match(/(昏迷查因|酸中毒|呼吸衰竭|两肺炎症|高血压|糖尿病)/g);
        if (dxList) {
          dxList.forEach(dx => addQual('初步诊断', dx));
        } else if (dxText) {
          addQual('初步诊断', dxText);
        }
      }
    }

    const symptomKeywords = [
      { key: '呼之不应', name: '主诉症状' },
      { key: '意识不清', name: '意识状态' },
      { key: '口吐白沫', name: '伴随症状' },
      { key: '呕吐', name: '伴随症状' },
      { key: '口唇紫', name: '体征' },
      { key: '干啰音', name: '肺部听诊' },
      { key: '心音低钝', name: '心脏听诊' },
      { key: '气管插管', name: '抢救处置' },
      { key: '心肺复苏', name: '急救处置' },
      { key: '人工心肺机', name: '急救处置' },
      { key: '呼吸机辅助呼吸', name: '抢救处置' },
    ];

    symptomKeywords.forEach(({ key, name }) => {
      if (fullText.includes(key) && !qualitativeData.some(item => item.value === key)) {
        addQual(name, key);
      }
    });

    return { qualitativeData, quantitativeData };
  }

  /**
   * 📦【备用历史版本】extractMedicalData_v1
   * ---------------------------------------------------------------------------------------
   * 功能说明：最早期的全局正则匹配提取函数，仅传入单纯的大文本 (text: string) 时使用。
   */
  public extractMedicalData_v1(text: string) {
    const quantitativeData: QuantitativeMetric[] = [];

    // 提取体温
    const tempMatch = text.match(/(?:体温|T|T\s*[:：])\s*([34]\d(?:\.\d)?)\s*(?:℃|°C|C)?/i);
    if (tempMatch) {
      quantitativeData.push({
        id: "temp-1",
        name: "体温",
        value: String(tempMatch[1]),
        unit: "℃",
      });
    }

    // 提取血压
    const bpMatch = text.match(/(?:血压|BP|BP\s*[:：])\s*(\d{2,3})\s*[\/\-\~]\s*(\d{2,3})\s*(?:mmHg)?/i);
    if (bpMatch) {
      quantitativeData.push({
        id: "bp-1",
        name: "血压",
        value: `${bpMatch[1]}/${bpMatch[2]}`,
        unit: "mmHg",
      });
    }

    const qualitativeData: QuantitativeMetric[] = [];
    const dxKeywords = ["两肺炎症", "临床综合征", "上呼吸道感染", "发热", "高血压", "糖尿病", "查体异常"];
    dxKeywords.forEach((kw, index) => {
      if (text.includes(kw)) {
        qualitativeData.push({
          id: `qual-${index}-${Date.now()}`,
          name: "诊断/表现",
          value: kw,
        });
      }
    });

    return { qualitativeData, quantitativeData };
  }
}

export const ocrService = new OcrService();