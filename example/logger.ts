import { configure, getConsoleSink, getLogger, getStreamSink } from '@logtape/logtape';
const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });

class WebSocketClient {
	url;
	options;
	reconnectAttempts;
	maxReconnectAttempts;
	reconnectInterval;
	ws;

	constructor(url: string, options = { maxReconnectAttempts: 5, reconnectInterval: 3000 }) {
		this.url = url;
		this.options = options;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
		this.reconnectInterval = options.reconnectInterval || 3000;
		// this.ws = new WebSocket(this.url);
		this.connect();
	}

	connect() {
		this.ws = new WebSocket(this.url);
		this.setupEventListeners();
	}

	setupEventListeners() {
		this.ws.onopen = () => {
			console.log('Connected');
			this.reconnectAttempts = 0;
		};

		this.ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			} catch (error) {
				console.error('Error parsing message:', error);
			}
		};

		this.ws.onclose = () => {
			console.log('Disconnected');
			this.handleReconnect();
		};

		this.ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};
	}

	handleMessage(data) {
		// Handle different types of messages
		switch (data.type) {
			case 'message':
				console.log('Received message:', data.content);
				break;
			// Add more cases as needed
		}
	}

	handleReconnect() {
		console.log('reconnecting');
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			setTimeout(() => this.connect(), this.reconnectInterval);
		}
	}

	send(data) {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		} else {
			console.error('WebSocket is not connected');
			this.reconnectAttempts = 0;
			this.handleReconnect();
		}
	}

	close() {
		this.ws.close();
	}
}

const socket = new WebSocketClient('ws://localhost:3333');
const writableStream = new WritableStream(
	{
		// Implement the sink
		write(chunk) {
			return new Promise((resolve, reject) => {
				socket.send(chunk);
				resolve();
			});
		},
		close() {
			console.error('closed');
		},
		abort(err) {
			console.error('Sink error:', err);
		},
		start(controller) {
			console.log('start stream');
		}
	},
	queuingStrategy
);

(async () =>
	await configure({
		sinks: {
			console: getConsoleSink(),
			stream: getStreamSink(writableStream)
		},
		loggers: [{ category: 'musqet', lowestLevel: 'debug', sinks: ['stream', 'console'] }],
		reset: true
	}))();
export const log = getLogger('musqet');
