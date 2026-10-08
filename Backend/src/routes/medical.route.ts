//在这里创建一个子 Elysia 实例，专门负责 /api/medical 前缀下的业务接口：
//小技巧：使用了 { prefix: '/api/medical' } 后，该子路由内部的路径只需要写 /parse，对外暴露的路径会自动组合为 /api/medical/parse。
import { Elysia, t } from 'elysia';
import { ocrService } from '../Service/OcrService';

export const medicalRoutes = new Elysia({ prefix: '/api/medical' })
  .post('/parse', async ({ body, set }) => {
    try {
      const file = body.file;
      console.log(`\n================ [收到前端文件上传] ================`);
      console.log(`文件名: ${file.name}`);
      console.log(`文件大小: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`文件类型: ${file.type}`);
      console.log(`====================================================\n`);

      // 1. 将上传的文件转换为 Buffer 字节流
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. 调用纯轻量 C++ OCR 服务进行图像解析与坐标提取
      const parseResult = await ocrService.parseImage(buffer);

      // 3. 提取定性/定量指标
      const medicalData = ocrService.extractMedicalData(parseResult);

      // 4. 返回给前端（拍平展开，直接包含 qualitativeData 和 quantitativeData）
      return {
        success: true,
        fileName: file.name,
        ...parseResult,
        ...medicalData,
      };
    } catch (error: any) {
      console.error('❌ [API 接口解析异常]:', error);
      
      set.status = 500;
      
      return {
        success: false,
        fileName: body.file?.name || 'unknown',
        message: error?.message || '图片解析失败，请检查服务器日志',
        text: '解析失败',
        blocks: [],
        qualitativeData: [],
        quantitativeData: {},
      };
    }
  }, {
    body: t.Object({
      file: t.File({
        description: '需解析的医疗单据/病历图片文件',
      }),
    }),
  });