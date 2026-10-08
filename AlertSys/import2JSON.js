import fs from 'fs';
import XLSX from 'xlsx';

function convertExcelToJson(inputExcelPath, outputJsonPath) {
  try {
    // 1. 读取 Excel 文件
    const workbook = XLSX.readFile(inputExcelPath);
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 2. 将工作表转换为二维数组
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
    
    if (rawData.length === 0) {
      console.log("Excel 文件中没有找到数据。");
      return;
    }

    // 3. 提取表头（第一行），并且只取前 5 列作为键名（Key）
    const headers = rawData[0].slice(0, 5).map((header, index) => {
      return header ? String(header).trim() : `Column_${index + 1}`;
    });
    
    // 4. 提取并处理所有数据行（从第二行开始）
    const dataRows = rawData.slice(1);
    
    const jsonResult = [];

    for (let row of dataRows) {
      // 过滤掉完全空白的行
      if (row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === '')) {
        continue; 
      }

      const rowObject = {};
      
      // 循环前 5 列
      for (let i = 0; i < 5; i++) {
        const key = headers[i];
        let val = row[i];

        if (val !== undefined && val !== null) {
          if (typeof val === 'string') {
            val = val.trim();
          } else {
            val = String(val); // 数字或其它类型统一转成字符串输出
          }
        } else {
          val = ""; // 默认空字符串
        }

        rowObject[key] = val;
      }
      
      jsonResult.push(rowObject);
    }
    
    // 5. 写入 JSON 文件
    fs.writeFileSync(outputJsonPath, JSON.stringify(jsonResult, null, 2), 'utf-8');
    
    console.log(`\n=========================================`);
    console.log(`🎉 转换完成！`);
    console.log(`- 读取表头: [ ${headers.join(' | ')} ]`);
    console.log(`- 成功转换了 ${jsonResult.length} 条病例数据`);
    console.log(`- JSON 已保存至: ${outputJsonPath}`);
    console.log(`=========================================\n`);

  } catch (error) {
    console.error("处理 Excel 转换时发生错误:", error.message);
  }
}

// ==================== 运行配置 ====================
const INPUT_FILE = 'testData.xlsx';
const OUTPUT_FILE = 'cases.json';

convertExcelToJson(INPUT_FILE, OUTPUT_FILE);