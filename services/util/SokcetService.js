const io = require('socket.io-client');

class SocketService {
	constructor(url) {
		this.socket = io(url, {
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: Infinity
		});

		this.socket.on('connect', () => {});

		this.socket.on('disconnect', () => {
			// // 接続が切れた場合の処理を記述
			// window.location.reload();
		});
	}

	sendHeartbeat() {
		if (this.socket) {
			this.socket.emit('heartbeat');
		}
	}

	getSocket() {
		return this.socket;
	}

      sendDataSocket(userData){
            this.socket.emit("sendUserData", userData)
      }
}

module.exports = SocketService