// 定义Bark设备类型
export interface Device {
  id: string;
  deviceCode: string;
  name: string;
  expireDate: string | null;
  isExpired: boolean;
}

// 定义消息类型
export interface Message {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  target: 'all' | 'group' | 'single';
  targetGroup?: string;
  targetDeviceId?: string;
  isSuccess: boolean;
  errorMessage?: string;
  // 补充字段：消息分组（用于接收端显示分组）
  messageGroup?: string;
  // 补充字段：推送头像URL（用于接收端显示头像）
  avatarUrl?: string;
}

// 定义用户设置类型
export interface UserSettings {
  avatarUrl: string;
}

// 定义消息分组类型
export type MessageGroup = '酒店BUG' | '八戒惠玩' | '通知';

// 定义连通性测试结果类型
export interface ConnectivityTestResult {
  timestamp: string;
  successCount: number;
  totalCount: number;
  results: Array<{
    deviceId: string;
    deviceName?: string;
    success: boolean;
    error?: string;
  }>;
}

// 定义系统状态类型
export interface BarkSystemState {
  devices: Device[];
  messages: Message[];
  settings: UserSettings;
}