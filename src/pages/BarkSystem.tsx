import { useState, useEffect } from 'react';
import { DeviceManager } from '../components/DeviceManager';
import { MessageSender } from '../components/MessageSender';
import { HistoryViewer } from '../components/HistoryViewer';
import { AvatarSettings } from '../components/AvatarSettings';
import { useBarkSystem } from '../hooks/useBarkSystem';
import { Device } from '../types';

export default function BarkSystem() {
  const { settings, getActiveDevices, getLastConnectivityTest } = useBarkSystem();
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'devices' | 'history' | 'settings'>('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<Device | null | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const activeDevices = getActiveDevices();
  const activeDeviceCount = activeDevices.length;
  
   // 监听网络连接状态变化
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // 初始检查
    setIsOnline(navigator.onLine);
    
    // 添加事件监听
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 定期检查网络连通性（每30秒）
    const checkInterval = setInterval(async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      
      // 更可靠的连通性检查
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://api.day.app', { 
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []);

  // 渲染页面标题
  const renderPageTitle = () => {
    switch (selectedTab) {
      case 'dashboard':
        return '控制面板';
      case 'devices':
        return '设备管理';
      case 'history':
        return '推送历史';
      case 'settings':
        return '头像设置';
      default:
        return '控制面板';
    }
  };

  // 渲染页面内容
  const renderPageContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <i className="fas fa-mobile-alt text-blue-500 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">活跃设备</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{activeDeviceCount}</h3>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <i className="fas fa-paper-plane text-green-500 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">消息分组</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">3</h3>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <i className="fas fa-history text-purple-500 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">推送历史</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">最近 7 天</h3>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MessageSender selectedDevice={selectedDevice} />
              </div>
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">快速选择设备</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">点击设备进行单设备推送</p>
                  
                  {activeDeviceCount === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      暂无活跃设备
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeDevices.slice(0, 5).map(device => (
                        <div 
                          key={device.id}
                          onClick={() => setSelectedDevice(device)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedDevice?.id === device.id 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                              <img 
                                src={settings.avatarUrl} 
                                alt="设备图标" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white">{device.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{device.group}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {activeDevices.length > 5 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setSelectedTab('devices')}
                            className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            查看全部 {activeDeviceCount} 台设备
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      
      case 'devices':
        return <DeviceManager onDeviceSelect={setSelectedDevice} />;
      
      case 'history':
        return <HistoryViewer />;
      
      case 'settings':
        return <AvatarSettings />;
      
      default:
        return <div>页面不存在</div>;
    }
  };

   return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* 顶部导航 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img 
                src={settings.avatarUrl} 
                alt="用户头像" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">Bark消息推送系统</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">多设备管理与推送平台</p>
            </div>
          </div>
          {/* 网络状态指示器和连通性测试结果摘要 */}
          <div className="flex items-center space-x-4">
            {/* 网络状态指示器 */}
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
            }`}>
              <i className={`fas mr-2 ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
              {isOnline ? '已连接' : '未连接'}
            </div>
            
            {/* 最近连通性测试结果摘要 */}
            {(() => {
              const lastTest = getLastConnectivityTest();
              if (lastTest) {
                const isSuccess = lastTest.successCount === lastTest.totalCount;
                return (
                  <div className={`flex items-center px-3 py-1 rounded-full text-xs ${
                    isSuccess 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                  }`}>
                    <i className="fas fa-network-wired mr-1"></i>
                    测试: {lastTest.successCount}/{lastTest.totalCount}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题和标签切换 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{renderPageTitle()}</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTab === 'dashboard' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-home mr-2"></i>控制面板
            </button>
            
            <button
              onClick={() => setSelectedTab('devices')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTab === 'devices' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-mobile-alt mr-2"></i>设备管理
            </button>
            
            <button
              onClick={() => setSelectedTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTab === 'history' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-history mr-2"></i>推送历史
            </button>
            
            <button
              onClick={() => setSelectedTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTab === 'settings' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-cog mr-2"></i>头像设置
            </button>
          </div>
        </div>
        
        {/* 页面内容 */}
        <div className="space-y-8">
          {renderPageContent()}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Bark消息推送系统 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}