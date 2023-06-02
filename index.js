const express = require('express');
const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
// Require database
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
//telegram package
const telegram = require('telegram-bot-api');

const app = express();

const port = process.env.PORT || 5000;

app.get('/', function (req, res) {
	res.send({
		success: true,
		message: 'App working fine........................11 AM'
	});
});

//products model
const PRODUCTS = mongoose.model('tbl_products', {
	title: String,
	product_id: String,
	description: String,
	created_date: String,
	image_url: Object,
	brand_url: String,
	purchase_url: String,
	price: String,
	source: String,
	is_active: Boolean
});

// Load the session data
mongoose
	.connect(
		'mongodb+srv://parminder:9988641591%40ptk@cluster0-ix992.mongodb.net/db_products?retryWrites=true&w=majority',
		{
			useNewUrlParser: true,
			useUnifiedTopology: true
		}
	)
	.then(() => {
		//console.log('CONNECT.........................');
		const store = new MongoStore({ mongoose: mongoose });
		const client = new Client({
			authStrategy: new RemoteAuth({
				store: store,
				backupSyncIntervalMs: 300000
			}),
			puppeteer: {
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				ignoreDefaultArgs: ['--disable-extensions']
			}
		});

		client.on('qr', (qr) => {
			qrcode.generate(qr, { small: true });
		});

		client.on('ready', () => { 
			scheduleJobForGf();
			scheduleJobForAd();
			scheduleJobForFd();
		}); 

		function scheduleJobForGf(){ 
			schedule.scheduleJob('*/1 * * * *', function () {
				const groupName = 'GirlsFab';

				client.getChats().then(function (chats) {
					const chatGroup = chats.find(
						(chat) => chat.name == groupName
					);
					if(chatGroup){
						sendImage(chatGroup, groupName);
					}
				}); 
			});
		}
		function scheduleJobForAd(){
			schedule.scheduleJob('*/2 * * * *', function () {
				const groupName = 'Amazon deals';

				client.getChats().then(function (chats) {
					const chatGroup = chats.find(
						(chat) => chat.name == groupName
					);
					if(chatGroup){
						sendImage(chatGroup, groupName);
					}
				}); 
			});
		}
		function scheduleJobForFd(){
			schedule.scheduleJob('*/3 * * * *', function () {
				const groupName = 'Flipkart deals';

				client.getChats().then(function (chats) {
					const chatGroup = chats.find(
						(chat) => chat.name == groupName
					);
					if(chatGroup){
						sendImage(chatGroup, groupName);
					}
				}); 
			});
		}

		async function sendImage(chatGroup, groupName) {
			try {
				let randomProduct = await PRODUCTS.find({ source: groupName.toLowerCase() }).limit(1);
				if (randomProduct && randomProduct.length > 0) {
					let retData = randomProduct[0];

					const media = await MessageMedia.fromUrl(retData.image_url[0]);
					client.sendMessage(chatGroup.id._serialized, media, {
						caption: `${retData.title} ${retData.purchase_url}`
					});

					//deleteAfterSent(retData.product_id);
					if(groupName == 'GirlsFab'){
						var api = new telegram({
							token: '6158204123:AAGoADPhxzS8wQGO8DeLWwZr6g8gpoQbSLo',
							async_requests: true,
							updates: {
								enabled: true,
								get_interval: 1000
							}
						});
			
						api.sendPhoto({
							chat_id: '@' + groupName//'@GirlsFab',
							caption: `${retData.title} ${retData.purchase_url}`,
							photo: retData.image_url[0]
						}).then(function (data) {
							deleteAfterSent(retData.product_id);
						});
					}else{
						deleteAfterSent(retData.product_id);
					}

				}
			} catch (err) {
			}
		}

		async function deleteAfterSent(productId) {
			const result = await PRODUCTS.findOneAndDelete({ product_id: productId });
			if (!result) {
				//console.log('Product not found................');
			} else {
				//console.log('Product deleted successfully..............');
			}
		}

		client.on('remote_session_saved', () => {
			console.log('remote_session_saved....................1234567890');
		});

		client.initialize();
	});

app.listen(port, '0.0.0.0', function () {
	console.log('App running on port ' + port);
});
