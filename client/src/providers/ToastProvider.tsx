import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { message } from 'antd';

type MessageApi = ReturnType<typeof message.useMessage>[0];
const ToastContext = createContext<MessageApi | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [messageApi, contextHolder] = message.useMessage({
    prefixCls: 'dashboard-message',
    duration: 3,
    maxCount: 3,
  });

  return (
    <ToastContext.Provider value={messageApi}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const messageApi = useContext(ToastContext);
  if (!messageApi) throw new Error('ToastProvider is required');

  return useMemo(
    () => ({
      success: (content: string) => messageApi.open({ type: 'success', content }),
      error: (content: string) =>
        messageApi.open({ type: 'error', content, duration: 5 }),
    }),
    [messageApi],
  );
}
