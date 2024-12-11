export type ConnectionStrategy = 'direct' | 'edge-function' | 'proxy';

export class VapiConnectionManager {
  private readonly API_KEY = "8b172799-931a-4e4e-be97-b2291b0b6434";
  private readonly ASSISTANT_ID = "03c8458b-0abb-4d0a-98f6-456f99cb5000";
  private currentStrategy: ConnectionStrategy = 'direct';
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_DELAY = 1000;

  private strategies: Record<ConnectionStrategy, () => Promise<WebSocket>> = {
    'direct': async () => {
      return new WebSocket('wss://api.vapi.ai/ws', [
        'vapi-protocol.v1',
        `vapi-api-key.${this.API_KEY}`
      ]);
    },
    'edge-function': async () => {
      return new WebSocket(`wss://${window.location.host}/functions/v1/vapi-proxy`, [
        'vapi-protocol.v1',
        `vapi-api-key.${this.API_KEY}`
      ]);
    },
    'proxy': async () => {
      // Fallback to a proxy server if both direct and edge function fail
      return new WebSocket('wss://proxy.your-domain.com/vapi', [
        'vapi-protocol.v1',
        `vapi-api-key.${this.API_KEY}`
      ]);
    }
  };

  constructor(
    private onOpen?: () => void,
    private onMessage?: (event: MessageEvent) => void,
    private onError?: (error: Event) => void,
    private onClose?: () => void
  ) {}

  async connect(): Promise<WebSocket | null> {
    const strategies: ConnectionStrategy[] = ['direct', 'edge-function', 'proxy'];
    
    for (const strategy of strategies) {
      try {
        console.log(`Attempting connection using ${strategy} strategy...`);
        this.ws = await this.connectWithStrategy(strategy);
        if (this.ws) {
          this.currentStrategy = strategy;
          console.log(`Successfully connected using ${strategy} strategy`);
          return this.ws;
        }
      } catch (error) {
        console.error(`Failed to connect using ${strategy} strategy:`, error);
        continue;
      }
    }
    
    throw new Error('All connection strategies failed');
  }

  private async connectWithStrategy(strategy: ConnectionStrategy): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const ws = this.strategies[strategy]();
        
        ws.then(socket => {
          socket.onopen = () => {
            this.setupWebSocket(socket);
            resolve(socket);
          };

          socket.onerror = (error) => {
            reject(error);
          };

          // Initialize VAPI session
          socket.addEventListener('open', () => {
            socket.send(JSON.stringify({
              type: "session.update",
              session: {
                assistant_id: this.ASSISTANT_ID,
                input_audio_config: {
                  sample_rate: 24000,
                  channels: 1,
                  encoding: "pcm_f32le"
                },
                output_audio_config: {
                  sample_rate: 24000,
                  channels: 1,
                  encoding: "pcm_f32le"
                }
              }
            }));
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupWebSocket(ws: WebSocket) {
    ws.onmessage = (event) => {
      this.onMessage?.(event);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError?.(error);
      this.handleReconnection();
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.onClose?.();
      this.handleReconnection();
    };
  }

  private async handleReconnection() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
      
      await new Promise(resolve => setTimeout(resolve, this.RECONNECT_DELAY));
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public send(data: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}