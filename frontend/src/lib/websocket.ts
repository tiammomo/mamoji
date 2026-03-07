import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  title?: string;
  content?: string;
  timestamp?: number;
  [key: string]: unknown;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:38080/ws';
    this.url = `${wsUrl}?token=${token}`;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribeToUser();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[WebSocket] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.isConnecting = false;
        this.attemptReconnect(token);
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.isConnecting = false;
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);

    setTimeout(() => {
      this.connect(token);
    }, this.reconnectDelay);
  }

  private subscribeToUser() {
    // STOMP 订阅逻辑
    if (this.ws?.readyState === WebSocket.OPEN) {
      // 发送 SUBSCRIBE 帧到 /user/queue/notifications
      const subscribeFrame = 'SUBSCRIBE\nid:sub-0\ndestination:/user/queue/notifications\n\n\x00';
      this.ws.send(subscribeFrame);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // 触发所有处理器
    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  subscribe(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 单例
export const wsClient = new WebSocketClient();

// React Hook
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    tokenRef.current = token;

    if (token) {
      wsClient.connect(token);
    }

    const unsubConnect = wsClient.subscribe('connected', () => {
      setIsConnected(true);
    });

    const unsubDisconnect = wsClient.subscribe('disconnected', () => {
      setIsConnected(false);
    });

    const unsubNotification = wsClient.subscribe('notification', (msg) => {
      setNotifications((prev) => [msg, ...prev].slice(0, 50));
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubNotification();
      wsClient.disconnect();
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    isConnected,
    notifications,
    clearNotifications,
    dismissNotification,
  };
}

// 通知类型
export interface Notification {
  id: string;
  type: 'budget_warning' | 'daily_summary' | 'recurring_transaction' | 'announcement' | string;
  title: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export function useNotifications() {
  const { notifications, clearNotifications, dismissNotification } = useWebSocket();

  const formattedNotifications: Notification[] = notifications.map((msg, index) => ({
    id: `${msg.timestamp || Date.now()}-${index}`,
    type: (msg.type as string) || 'notification',
    title: msg.title || '通知',
    content: msg.content || '',
    timestamp: msg.timestamp || Date.now(),
    read: false,
  }));

  return {
    notifications: formattedNotifications,
    unreadCount: formattedNotifications.filter((n) => !n.read).length,
    clearNotifications,
    dismissNotification,
  };
}
