import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Device, Message, UserSettings, MessageGroup, BarkSystemState, ConnectivityTestResult } from '../types';

const STORAGE_KEY = 'bark-system-data';
const DEFAULT_AVATAR_URL = 'https://img10.360buyimg.com/ling/jfs/t1/376729/40/5083/101103/6937f57eF170806bf/089526d26d3dd748.jpg';
const DEFAULT_MESSAGE_GROUPS: MessageGroup[] = ['酒店BUG', '八戒惠玩', '通知'];

export function useBarkSystem() {
  // 初始化系统状态
  const [systemState, setSystemState] = useState<BarkSystemState>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        // 处理现有数据，移除设备中的group字段
        const parsedData = JSON.parse(savedData);
        if (parsedData.devices && Array.isArray(parsedData.devices)) {
          parsedData.devices = parsedData.devices.map((device: any) => {
            const { group, ...rest } = device;
            return rest;
          });
        }
        return parsedData;
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
    
    // 默认状态
    return {
      devices: [],
      messages: [],
      settings: {
        avatarUrl: DEFAULT_AVATAR_URL
      }
    };
  });

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(systemState));
  }, [systemState]);

  // 检查设备是否过期
  useEffect(() => {
    const checkExpiredDevices = () => {
      const now = new Date().toISOString().split('T')[0];
      setSystemState(prev => ({
        ...prev,
        devices: prev.devices.map(device => ({
          ...device,
          isExpired: device.expireDate && device.expireDate < now
        }))
      }));
    };

    // 初始检查
    checkExpiredDevices();
    
    // 每天检查一次
    const intervalId = setInterval(checkExpiredDevices, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 获取所有消息分组
  const getMessageGroups = (): MessageGroup[] => {
    return DEFAULT_MESSAGE_GROUPS;
  };

  // 添加设备
  const addDevice = (deviceCode: string, name: string, expireDate: string | null) => {
    const now = new Date().toISOString().split('T')[0];
    const newDevice: Device = {
      id: Date.now().toString(),
      deviceCode,
      name,
      expireDate,
      isExpired: expireDate && expireDate < now
    };

    setSystemState(prev => ({
      ...prev,
      devices: [...prev.devices, newDevice]
    }));
    
    toast.success('设备添加成功');
  };

  // 删除设备
  const deleteDevice = (deviceId: string) => {
    setSystemState(prev => ({
      ...prev,
      devices: prev.devices.filter(device => device.id !== deviceId)
    }));
    
    toast.success('设备删除成功');
  };

  // 更新设备
  const updateDevice = (updatedDevice: Device) => {
    const now = new Date().toISOString().split('T')[0];
    const deviceWithExpiryCheck = {
      ...updatedDevice,
      isExpired: updatedDevice.expireDate && updatedDevice.expireDate < now
    };

    setSystemState(prev => ({
      ...prev,
      devices: prev.devices.map(device => 
        device.id === updatedDevice.id ? deviceWithExpiryCheck : device
      )
    }));
    
    toast.success('设备更新成功');
  };

  // 发送消息
  const sendMessage = async (title: string, content: string, target: 'all' | 'group' | 'single', messageGroup?: string, targetDeviceId?: string) => {
    // 1. 检查网络连接状态
    if (!navigator.onLine) {
      toast.error('网络连接已断开，请检查网络后重试');
      return;
    }
    
    // 准备要发送的设备列表
    let devicesToSend: Device[] = [];
    
    if (target === 'all') {
      devicesToSend = systemState.devices.filter(device => !device.isExpired);
    } else if (target === 'single' && targetDeviceId) {
      const device = systemState.devices.find(d => d.id === targetDeviceId);
      if (device && !device.isExpired) {
        devicesToSend = [device];
      }
    }

    if (devicesToSend.length === 0) {
      toast.error('没有找到有效的设备');
      return;
    }

    // 2. 设置消息分组（用于接收端显示分组），默认使用"酒店BUG"
    const finalMessageGroup = messageGroup || '酒店BUG';
    
    // 3. 获取当前设置的头像URL（用于接收端显示头像）
    const avatarUrl = systemState.settings.avatarUrl;

    // 记录消息历史，包含分组和头像信息
    const newMessage: Message = {
      id: Date.now().toString(),
      title,
      content,
      timestamp: new Date().toISOString(),
      target,
      targetGroup: undefined, // 不再使用设备分组
      targetDeviceId,
      isSuccess: false,
      errorMessage: undefined,
      messageGroup: finalMessageGroup,
      avatarUrl
    };

    // 4. 发送消息到每个设备
    const results = [];
    let allSuccess = true;
    
    // 显示发送进度提示
    toast.info(`正在向 ${devicesToSend.length} 台设备发送消息...`);
    
    for (const device of devicesToSend) {
      try {
        // 构建Bark API URL - 包含分组和头像信息
        // 正确的Bark API格式: https://api.day.app/{deviceKey}/{title}/{content}?group={groupName}&icon={iconUrl}
        const encodedTitle = encodeURIComponent(title);
        const encodedContent = encodeURIComponent(content);
        const encodedGroup = encodeURIComponent(finalMessageGroup);
        const encodedIcon = encodeURIComponent(avatarUrl);
        
        const barkApiUrl = `https://api.day.app/${device.deviceCode}/${encodedTitle}/${encodedContent}?group=${encodedGroup}&icon=${encodedIcon}`;
        
        // 真实调用Bark API
        const response = await fetch(barkApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          timeout: 10000 // 10秒超时
        });
        
        if (!response.ok) {
          throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.code !== 200) {
          throw new Error(`Bark API错误: ${data.message || '未知错误'}`);
        }
        
        results.push({ deviceId: device.id, success: true });
      } catch (error) {
        allSuccess = false;
        const errorMsg = error instanceof Error ? error.message : '发送失败';
        results.push({ 
          deviceId: device.id, 
          success: false, 
          error: errorMsg 
        });
        
        console.error(`向设备 ${device.name} 发送消息失败:`, errorMsg);
      }
    }
    
    // 更新消息状态
    newMessage.isSuccess = allSuccess;
    
    if (!allSuccess) {
      newMessage.errorMessage = results.filter(r => !r.success)
        .map(r => {
          const device = devicesToSend.find(d => d.id === r.deviceId);
          return `设备 ${device?.name || '未知'}: ${r.error}`;
        })
        .join('; ');
        
      toast.error(`消息发送完成，但有 ${results.filter(r => !r.success).length} 台设备发送失败`);
    } else {
      toast.success(`消息已成功发送到 ${devicesToSend.length} 台设备`);
    }
    
    // 保存消息历史
    setSystemState(prev => ({
      ...prev,
      messages: [newMessage, ...prev.messages]
    }));
    
    // 记录详细的连通性测试结果
    localStorage.setItem('lastConnectivityTest', JSON.stringify({
      timestamp: new Date().toISOString(),
      successCount: results.filter(r => r.success).length,
      totalCount: devicesToSend.length,
      results: results.map(r => ({
        ...r,
        deviceName: devicesToSend.find(d => d.id === r.deviceId)?.name
      }))
    }));
  };

  // 更新头像
  const updateAvatar = (avatarUrl: string) => {
    setSystemState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        avatarUrl
      }
    }));
    
    toast.success('头像更新成功');
  };

  // 获取所有未过期设备
  const getActiveDevices = () => {
    return systemState.devices.filter(device => !device.isExpired);
  };

  // 获取历史消息
  const getHistoryMessages = () => {
    return systemState.messages;
  };

  // 获取用户设置
  const getUserSettings = () => {
    return systemState.settings;
  };

  return {
    devices: systemState.devices,
    messages: systemState.messages,
    settings: systemState.settings,
    getMessageGroups,
    addDevice,
    deleteDevice,
    updateDevice,
    sendMessage,
    updateAvatar,
    getActiveDevices,
    getHistoryMessages,
    getUserSettings,
    
    // 新增：验证设备码
    validateDeviceCode: async (deviceCode: string): Promise<boolean> => {
      try {
        // 简单验证设备码格式
        if (!deviceCode || typeof deviceCode !== 'string' || deviceCode.length < 10) {
          return false;
        }
        
        // 检查网络连接
        if (!navigator.onLine) {
          throw new Error('网络未连接，无法验证设备码');
        }
        
        // 尝试发送一个测试消息到Bark服务器
        const testTitle = '设备验证';
        const testContent = '这是一条设备验证消息，收到请忽略';
        const encodedTitle = encodeURIComponent(testTitle);
        const encodedContent = encodeURIComponent(testContent);
        
        const barkApiUrl = `https://api.day.app/${deviceCode}/${encodedTitle}/${encodedContent}?isArchive=1&autoCopy=0`;
        
        const response = await fetch(barkApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          timeout: 10000 // 10秒超时
        });
        
        if (!response.ok) {
          throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        return data.code === 200;
      } catch (error) {
        console.error('设备码验证失败:', error);
        return false;
      }
    },
    
    // 新增：获取最近的连通性测试结果
    getLastConnectivityTest: (): ConnectivityTestResult | null => {
      try {
        const testResult = localStorage.getItem('lastConnectivityTest');
        return testResult ? JSON.parse(testResult) : null;
      } catch (error) {
        console.error('获取连通性测试结果失败:', error);
        return null;
      }
    },
    
    // 新增：执行连通性测试
    runConnectivityTest: async (): Promise<ConnectivityTestResult> => {
      const activeDevices = systemState.devices.filter(device => !device.isExpired);
      const results = [];
      
      toast.info(`正在测试 ${activeDevices.length} 台设备的连通性...`);
      
      for (const device of activeDevices) {
        try {
          const testTitle = '连通性测试';
          const testContent = '这是一条连通性测试消息，收到请忽略';
          const encodedTitle = encodeURIComponent(testTitle);
          const encodedContent = encodeURIComponent(testContent);
          
          const barkApiUrl = `https://api.day.app/${device.deviceCode}/${encodedTitle}/${encodedContent}?isArchive=1&autoCopy=0`;
          
          const response = await fetch(barkApiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            timeout: 10000 // 10秒超时
          });
          
          if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.code !== 200) {
            throw new Error(`Bark API错误: ${data.message || '未知错误'}`);
          }
          
          results.push({ 
            deviceId: device.id, 
            deviceName: device.name,
            success: true 
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '连接失败';
          results.push({ 
            deviceId: device.id, 
            deviceName: device.name,
            success: false, 
            error: errorMsg 
          });
        }
      }
      
      const testResult: ConnectivityTestResult = {
        timestamp: new Date().toISOString(),
        successCount: results.filter(r => r.success).length,
        totalCount: activeDevices.length,
        results
      };
      
      // 保存测试结果
      localStorage.setItem('lastConnectivityTest', JSON.stringify(testResult));
      
      toast.success(`连通性测试完成: ${testResult.successCount}/${testResult.totalCount} 台设备连接成功`);
      
      return testResult;
    }
  };
}