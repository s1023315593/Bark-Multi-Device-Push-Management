import { useState } from 'react';
import { useBarkSystem } from '../hooks/useBarkSystem';

export function AvatarSettings() {
  const { settings, updateAvatar } = useBarkSystem();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(settings.avatarUrl);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/gif')) {
      alert('请上传JPG、PNG或GIF格式的图片');
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);

    // 模拟上传过程
    setTimeout(() => {
      // 在实际应用中，这里应该将文件上传到服务器，然后获取返回的URL
      // 这里使用FileReader来模拟
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setPreviewUrl(url);
        updateAvatar(url);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const handleResetAvatar = () => {
    if (confirm('确定要重置头像吗？')) {
      const defaultAvatarUrl = 'https://img10.360buyimg.com/ling/jfs/t1/376729/40/5083/101103/6937f57eF170806bf/089526d26d3dd748.jpg';
      setPreviewUrl(defaultAvatarUrl);
      updateAvatar(defaultAvatarUrl);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">头像设置</h2>
      
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 shadow-md">
            <img 
              src={previewUrl} 
              alt="用户头像" 
              className="w-full h-full object-cover"
            />
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <i className="fas fa-circle-notch fa-spin text-white text-3xl"></i>
            </div>
          )}
        </div>
        
        <div className="space-y-4 w-full max-w-md">
          <div className="relative">
            <input
              type="file"
              id="avatar-upload"
              onChange={handleAvatarChange}
              accept="image/jpeg, image/png, image/gif"
              className="hidden"
            />
            <label
              htmlFor="avatar-upload"
              className="block text-center py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  上传中...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  更换头像
                </>
              )}
            </label>
          </div>
          
          <button
            onClick={handleResetAvatar}
            className="w-full py-2.5 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
          >
            <i className="fas fa-undo-alt mr-2"></i>
            重置头像
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            <p className="mb-2">
              <i className="fas fa-info-circle text-blue-500 mr-1"></i>
              头像上传说明：
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>支持JPG、PNG、GIF格式的图片</li>
              <li>图片大小不能超过5MB</li>
              <li>建议上传方形图片以获得最佳显示效果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}