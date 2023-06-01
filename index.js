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
		message: 'App working fine........................11:37 AM'
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
		console.log('CONNECT.........................');
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
			schedule.scheduleJob('*/5 * * * *', function () {
				console.log('schedule.........................');
				client.getChats().then(function (chats) {
					const chatGroup = chats.find(
						(chat) => chat.name == 'GirlsFab'
					);
					sendImage(chatGroup);
				});
			});
		}); 

		async function sendImage(chatGroup) {
			try {
				let randomProduct = await PRODUCTS.find({ source: 'girlsfab' }).limit(1);
				if (randomProduct && randomProduct.length > 0) {
					let retData = randomProduct[0];

					const media = await MessageMedia.fromUrl(retData.image_url[0]);
					client.sendMessage(chatGroup.id._serialized, media, {
						caption: `${retData.title} ${retData.purchase_url}`
					});

					deleteAfterSent(retData.product_id);

				}
			} catch (err) {
				console.log('ERROR');
			}
		}

		async function deleteAfterSent(productId) {
			const result = await PRODUCTS.findOneAndDelete({ product_id: productId });
			if (!result) {
				console.log('Product not found................');
			} else {
				console.log('Product deleted successfully..............');
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
