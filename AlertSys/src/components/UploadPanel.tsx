//上传病历、图片OCR
import React, { useState } from 'react';

export default function UploadPanel() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setFileName(file.name);

    // 1. 发送开始事件
    window.dispatchEvent(new CustomEvent('UPLOAD_START', { detail: { fileName: file.name } }));

    // 2. 组装 FormData 发送到后端
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/medical/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      // 3. 拿到后端真正的 OCR 分析数据并广播
      window.dispatchEvent(new CustomEvent('METRICS_QUALITATIVE_DATA', { detail: data.qualitativeData }));
      window.dispatchEvent(new CustomEvent('METRICS_QUANTITATIVE_DATA', { detail: data.quantitativeData }));
    } catch (err) {
      console.error('上传解析失败', err);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]); // 👈 调真实接口
    }
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      
      onDragLeave={() => setIsDragOver(false)}
      
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          uploadFile(e.dataTransfer.files[0]); // 👈 加上这句，拖拽也能发给后端
        }
      }}
      className={`flex-1 border-2 border-dashed rounded-xl p-4 bg-white flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-sm min-h-[80px] 
        ${isDragOver ? 'border-blue-500 bg-blue-50/30' : 'border-emerald-300 hover:border-emerald-400'}`}
      >
      
      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        
        <input type="file" accept="image/*,.pdf,.txt,.docx" className="hidden" onChange={handleFileChange} />
        
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner">📂</div>
        
        <span className="font-bold text-emerald-800 mt-2 block text-sm">补充上传附件</span>
        
        <p className="text-xs text-slate-400 mt-1 max-w-[180px]">
          {fileName ? `已选择: ${fileName}` : '补充上传患者表格文档pdf图片声音'}
        </p>
      
      </label>
    </div>
  );
}