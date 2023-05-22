const express = require('express');
const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
// Require database
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

const app = express();

const port = process.env.PORT || 5000;

app.get('/', function (req, res) {
	res.send({
		success: true,
		message: 'WhatsApp message sent successfully.............START'
	});
});

// Load the session data

// mongoose
// 	.connect(
// 		'mongodb+srv://parminder:9988641591%40ptk@cluster0-ix992.mongodb.net/db_products?retryWrites=true&w=majority',
// 		{
// 			useNewUrlParser: true,
// 			useUnifiedTopology: true
// 		}
// 	)
// 	.then(() => {
// 		console.log('CONNECT.........................');
// 		const store = new MongoStore({ mongoose: mongoose });
// 		const client = new Client({
// 			authStrategy: new RemoteAuth({
// 				store: store,
// 				backupSyncIntervalMs: 300000
// 			})
// 		});

// 		client.on('qr', (qr) => {
// 			qrcode.generate(qr, { small: true });
// 		});

// 		client.on('ready', () => {
// 			console.log('Client is ready!');
// 			schedule.scheduleJob('*/1 * * * *', function () {
// 				console.log('schedule.........................');
// 				client.getChats().then(function (chats) {
// 					const chatGroup = chats.find(
// 						(chat) => chat.name == 'GirlsFab'
// 					);
// 					console.log(chatGroup.id._serialized);
// 					// client.sendMessage(
// 					// 	chatGroup.id._serialized,
// 					// 	'Number is ' + Math.floor(Math.random() * 10)
// 					// );
// 					sendImage(chatGroup);
// 				});
// 			});
// 			// cron.schedule('*/59 * * * * *', function () {
// 			// 	client.getChats().then(function (chats) {
// 			// 		const chatGroup = chats.find(
// 			// 			(chat) => chat.name == 'GirlsFab'
// 			// 		);
// 			// 		//console.log(chatGroup);
// 			// 		// client.sendMessage(
// 			// 		// 	chatGroup.id._serialized,
// 			// 		// 	'Number is ' + Math.floor(Math.random() * 10)
// 			// 		// );
// 			// 		sendImage(chatGroup);
// 			// 	});
// 			// });
// 		});

// 		async function sendImage(chatGroup) {
// 			console.log('sendImage....................');
// 			const media = await MessageMedia.fromUrl(
// 				'https://m.media-amazon.com/images/I/91p5L+GitZL._SX569_.jpg'
// 			);
// 			client.sendMessage(chatGroup.id._serialized, media, {
// 				caption: 'https://amzn.to/3BGm8Yw'
// 			});
// 		}

// 		client.on('remote_session_saved', () => {
// 			console.log('remote_session_saved....................1234567890');
// 		});

// 		client.initialize();
// 	});

app.listen(port, '0.0.0.0', function () {
	console.log('App running on port ' + port);
});
