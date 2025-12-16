import { useState } from 'react';
import { useBarkSystem } from '../hooks/useBarkSystem';
import { Empty } from './Empty';

export function HistoryViewer() {
  const { messages, getLastConnectivityTest, runConnectivityTest } = useBarkSystem();
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  // 过滤消息
  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    if (filter === 'success') return message.isSuccess;
    if (filter === 'failed') return !message.isSuccess;
    return true;
  });

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取目标显示文本
  const getTargetDisplayText = (message: any) => {
    if (message.target === 'all') {
      return '全部设备';
    } else if (message.target === 'single') {
      return '单设备';
    }
    return '未知';
  };

  // 获取状态样式
  const getStatusStyle = (isSuccess: boolean) => {
    return isSuccess 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
  };

  // 获取状态图标
  const getStatusIcon = (isSuccess: boolean) => {
    return isSuccess ? 'check-circle' : 'times-circle';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">推送历史</h2>
        
        {/* 过滤器和连通性测试按钮 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex space-x-2 mb-4 md:mb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              全部 ({messages.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
                filter === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              成功 ({messages.filter(m => m.isSuccess).length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
                filter === 'failed' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              失败 ({messages.filter(m => !m.isSuccess).length})
            </button>
          </div>
          
          {/* 连通性测试按钮 */}
          <button
            onClick={runConnectivityTest}
            disabled={!navigator.onLine}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors duration-200 flex items-center ${
              !navigator.onLine
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <i className="fas fa-network-wired mr-2"></i>
            运行连通性测试
          </button>
        </div>
      </div>

      {/* 显示连通性测试结果 */}
      {(() => {
        const lastTest = getLastConnectivityTest();
        if (lastTest) {
          const isSuccess = lastTest.successCount === lastTest.totalCount;
          const testDate = new Date(lastTest.timestamp).toLocaleString('zh-CN');
          
          return (
            <div className={`mb-6 p-4 rounded-lg border ${
              isSuccess 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`font-semibold text-lg mb-2 ${
                    isSuccess ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'
                  }`}>
                    <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                    连通性测试报告
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">测试时间: {testDate}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    结果: {lastTest.successCount}/{lastTest.totalCount} 台设备连接成功
                  </p>
                </div>
                <button 
                  onClick={() => {
                    // 显示详细报告
                    const details = lastTest.results.map(r => 
                      `${r.deviceName || '未知设备'}: ${r.success ? '成功' : `失败 (${r.error})`}`
                    ).join('\n');
                    alert(`连通性测试详细结果:\n\n${details}`);
                  }}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                >
                  查看详情
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}
      
      {filteredMessages.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div 
              key={message.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-md dark:hover:shadow-gray-900/30"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mr-2">{message.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(message.isSuccess)}`}>
                      <i className={`fas fa-${getStatusIcon(message.isSuccess)} mr-1`}></i>
                      {message.isSuccess ? '成功' : '失败'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{message.content}</p>
                  
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-500">
                      <div className="flex items-center">
                        <i className="far fa-clock mr-1"></i>
                        {formatDateTime(message.timestamp)}
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-arrows-alt mr-1"></i>
                        {getTargetDisplayText(message)}
                      </div>
                      {message.messageGroup && (
                        <div className="flex items-center">
                          <i className="fas fa-tags mr-1"></i>
                          消息分组: {message.messageGroup}
                        </div>
                      )}
                    </div>
                </div>
              </div>
              
              {!message.isSuccess && message.errorMessage && (
                <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    错误信息: {message.errorMessage}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}