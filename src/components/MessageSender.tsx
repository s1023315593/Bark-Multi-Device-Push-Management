import { useState, useEffect } from 'react';
import { useBarkSystem } from '../hooks/useBarkSystem';
import { Device } from '../types';

interface MessageSenderProps {
  selectedDevice?: Device | null;
}

export function MessageSender({ selectedDevice }: MessageSenderProps) {
  const { getMessageGroups, getActiveDevices, sendMessage } = useBarkSystem();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    messageGroup: '酒店BUG', // 默认选中"酒店BUG"分组
    target: 'all' as 'all' | 'single'
  });
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const activeDevices = getActiveDevices();
  const activeDeviceCount = activeDevices.length;
  
  // 监听网络连接状态变化
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 当从外部选择设备时，更新目标
  useEffect(() => {
    if (selectedDevice) {
      setFormData(prev => ({
        ...prev,
        target: 'single'
      }));
    }
  }, [selectedDevice]);

  const handleSendMessage = async () => {
    if (!formData.title || !formData.content) {
      alert('请填写标题和内容');
      return;
    }

    if (activeDeviceCount === 0) {
      alert('没有可用的设备');
      return;
    }

    setIsSending(true);
    
    try {
      await sendMessage(
        formData.title,
        formData.content,
        formData.target,
        formData.messageGroup, // 传递消息分组
        formData.target === 'single' && selectedDevice ? selectedDevice.id : undefined
      );
      
      // 重置表单
      setFormData(prev => ({
        ...prev,
        title: '',
        content: ''
      }));
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getTargetDisplayText = () => {
    if (formData.target === 'all') {
      return `全部设备 (${activeDeviceCount} 台)`;
    } else if (formData.target === 'single' && selectedDevice) {
      return `${selectedDevice.name}`;
    }
    return '';
  };

  // 获取分组样式
  const getGroupStyle = (group: string) => {
    return group === '酒店BUG' 
      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      : group === '八戒惠玩'
        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">消息推送</h2>
      
      <div className="space-y-6">
        {/* 目标选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            推送目标
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormData(prev => ({...prev, target: 'all'}))}
              className={`py-3 px-4 border rounded-lg transition-colors duration-200 text-left ${
                formData.target === 'all' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-center">
                <i className={`fas fa-broadcast-tower mr-2 ${formData.target === 'all' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}></i>
                <span>全部设备</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activeDeviceCount} 台可用</div>
            </button>
            
            <button
              onClick={() => setFormData(prev => ({...prev, target: 'single'}))}
              className={`py-3 px-4 border rounded-lg transition-colors duration-200 text-left ${
                formData.target === 'single' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-center">
                <i className={`fas fa-mobile-alt mr-2 ${formData.target === 'single' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}></i>
                <span>单设备推送</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">选择一台设备</div>
            </button>
          </div>
        </div>
        
        {/* 消息分组选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            消息分组（用于接收端显示分组）
          </label>
          <div className="flex flex-wrap gap-3">
            {getMessageGroups().map(group => (
              <button
                key={group}
                onClick={() => setFormData(prev => ({...prev, messageGroup: group}))}
                className={`px-4 py-2 rounded-full text-sm transition-colors duration-200 ${
                  formData.messageGroup === group 
                    ? 'bg-blue-500 text-white' 
                    : `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600`
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
        
         {/* 消息标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            消息标题
          </label>
          
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="请输入消息标题"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>
        
        {/* 消息内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            消息内容
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            placeholder="请输入消息内容"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
          />
        </div>
        
         {/* 推送信息摘要 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            <span>
              {selectedDevice && formData.target === 'single' 
                ? `将向设备"${selectedDevice.name}"发送消息，消息将按"${formData.messageGroup}"分组显示在接收端`
                : `将向${getTargetDisplayText()}发送消息，消息将按"${formData.messageGroup}"分组显示在接收端`
              }
            </span>
          </div>
        </div>
        
        {/* 发送按钮 */}
        <div className="pt-2">
          <button
            onClick={handleSendMessage}
            disabled={isSending || !formData.title || !formData.content || activeDeviceCount === 0 || 
                      (formData.target === 'single' && !selectedDevice) || !isOnline}
            className={`w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center ${
              isSending || !formData.title || !formData.content || activeDeviceCount === 0 || 
              (formData.target === 'single' && !selectedDevice) || !isOnline
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg'
            }`}
          >
            {isSending ? (
              <>
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
                发送中...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                发送消息
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}