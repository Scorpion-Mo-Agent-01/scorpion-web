"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
}

export function useSocket(url: string, token?: string, onMessageCallback?: (message: WebSocketMessage) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageQueue = useRef<WebSocketMessage[]>([]);
  const onMessageRef = useRef(onMessageCallback);

  // Update ref when onMessageCallback changes
  useEffect(() => {
    onMessageRef.current = onMessageCallback;
  }, [onMessageCallback]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      messageQueue.current.push(message);
    }
  }, []);

  useEffect(() => {
    // Don’t connect until we have a token (gateway requires it)
    if (!token) {
      return;
    }

    const socketUrl = `${url}?token=${token}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      while (messageQueue.current.length > 0) {
        const msg = messageQueue.current.shift();
        if (msg) ws.current?.send(JSON.stringify(msg));
      }
    };

    ws.current.onmessage = event => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        onMessageRef.current?.(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.current.onerror = error => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.current?.close();
    };
  }, [url, token]);

  return { wsRef: ws, isConnected, lastMessage, sendMessage };
}
