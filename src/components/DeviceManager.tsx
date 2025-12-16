import { useState } from 'react';
import { Device } from '../types';
import { useBarkSystem } from '../hooks/useBarkSystem';
import { toast } from 'react-toastify';

interface DeviceManagerProps {
  onDeviceSelect?: (device: Device) => void;
}

export function DeviceManager({ onDeviceSelect }: DeviceManagerProps) {
  const { devices, addDevice, deleteDevice, updateDevice, validateDeviceCode } = useBarkSystem();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    deviceCode: '',
    name: '',
    expireDate: '' as string | null
  });

  const handleAddDevice = async () => {
    if (!formData.deviceCode || !formData.name) {
      alert('请填写设备码和设备名称');
      return;
    }
    
    // 验证设备码
    try {
      setIsAdding(true);
      toast.info('正在验证设备码...');
      
      const isValid = await validateDeviceCode(formData.deviceCode);
      
      if (!isValid) {
        toast.error('设备码验证失败，请检查设备码是否正确');
        setIsAdding(false);
        return;
      }
      
      addDevice(formData.deviceCode, formData.name, formData.expireDate);
      
      // 重置表单
      setFormData({
        deviceCode: '',
        name: '',
        expireDate: null
      });
      setIsAdding(false);
    } catch (error) {
      toast.error('添加设备失败，请稍后重试');
      setIsAdding(false);
    }
  };

  const handleEditDevice = (device: Device) => {
    setIsEditing(device.id);
    setFormData({
      deviceCode: device.deviceCode,
      name: device.name,
      expireDate: device.expireDate
    });
  };

  const handleUpdateDevice = async (deviceId: string) => {
    if (!formData.deviceCode || !formData.name) {
      alert('请填写设备码和设备名称');
      return;
    }
    
    // 验证设备码
    try {
      setIsEditing(deviceId);
      toast.info('正在验证设备码...');
      
      const isValid = await validateDeviceCode(formData.deviceCode);
      
      if (!isValid) {
        toast.error('设备码验证失败，请检查设备码是否正确');
        setIsEditing(null);
        return;
      }
      
      updateDevice({
        id: deviceId,
        deviceCode: formData.deviceCode,
        name: formData.name,
        expireDate: formData.expireDate,
        isExpired: false // 会在hook中重新计算
      });
      
      // 重置编辑状态
      setIsEditing(null);
      setFormData({
        deviceCode: '',
        name: '',
        expireDate: null
      });
    } catch (error) {
      toast.error('更新设备失败，请稍后重试');
      setIsEditing(null);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      deviceCode: '',
      name: '',
      expireDate: null
    });
  };

  // 获取今天的日期字符串，格式为YYYY-MM-DD
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">设备管理</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>添加设备
        </button>
      </div>

      {isAdding || isEditing ? (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            {isAdding ? '添加新设备' : '编辑设备'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                设备码
              </label>
              <input
                type="text"
                value={formData.deviceCode}
                onChange={(e) => setFormData({...formData, deviceCode: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入Bark设备码"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                设备名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入设备名称"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                过期时间（可选）
              </label>
              <input
                type="date"
                value={formData.expireDate || ''}
                onChange={(e) => setFormData({...formData, expireDate: e.target.value || null})}
                min={getTodayDate()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={isAdding ? handleAddDevice : () => isEditing && handleUpdateDevice(isEditing)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isAdding ? '添加' : '更新'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                设备名称
              </th>
              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                设备码
              </th>
              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                过期时间
              </th>
              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                  暂无设备，请点击"添加设备"按钮添加
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${onDeviceSelect ? '' : 'cursor-default'}`}
                    onClick={() => onDeviceSelect && !device.isExpired && onDeviceSelect(device)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">{device.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{device.deviceCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {device.expireDate || '永不过期'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      device.isExpired ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    }`}>
                      {device.isExpired ? '已过期' : '正常'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDevice(device);
                      }}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      disabled={device.isExpired}
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除设备"${device.name}"吗？`)) {
                          deleteDevice(device.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}