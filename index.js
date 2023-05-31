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
		message: 'Message sent successfully.............111'
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
			console.log('Client is ready!'); 
			schedule.scheduleJob('*/5 * * * *', function () {
				console.log('schedule.........................');
				client.getChats().then(function (chats) {
					const chatGroup = chats.find(
						(chat) => chat.name == 'GirlsFab'
					);
					// client.sendMessage(
					// 	chatGroup.id._serialized,
					// 	'Number is ' + Math.floor(Math.random() * 10)
					// );
					sendImage(chatGroup);
				});
			});
		});

		/* const bags = [
			{
				text: "Classy Leather Personalized Women's Fashion Backpack",
				affilate_url: 'https://amzn.to/3WpAXIw',
				image_url:
					'https://m.media-amazon.com/images/I/716pjUWL5lL._UX679_.jpg'
			},
			{
				text: 'FLYING BERRY women hand bag (COMBO PACK OF 2)',
				affilate_url: 'https://amzn.to/3Owfegc',
				image_url:
					'https://m.media-amazon.com/images/I/81vGUZbDquL._UY695_.jpg'
			},
			{
				text: "Lavie Women's Beech Satchel Bag | Ladies Purse Handbag",
				affilate_url: 'https://amzn.to/42VspLL',
				image_url:
					'https://m.media-amazon.com/images/I/71c7XRaZk4L._UY575_.jpg'
			},
			{
				text: "Lavie Women's Faroe Satchel Bag | Ladies Purse Hobo Handbag",
				affilate_url: 'https://amzn.to/41ZM2kO',
				image_url:
					'https://m.media-amazon.com/images/I/713+kR7tG2S._UY575_.jpg'
			},
			{
				text: "Lavie Women's Ficus Satchel Bag | Ladies Purse Handbag",
				affilate_url: 'https://amzn.to/42WgD45',
				image_url:
					'https://m.media-amazon.com/images/I/712B8hlWWsS._UY575_.jpg'
			},
			{
				text: "Lino Perros Women's leatherette Tote Bag",
				affilate_url: 'https://amzn.to/41W2e6E',
				image_url:
					'https://m.media-amazon.com/images/I/713PyK91XHL._UY500_.jpg'
			},
			{
				text: "Lavie Women's Ushawu Satchel Bag | Ladies Purse Handbag",
				affilate_url: 'https://amzn.to/3C5uysR',
				image_url:
					'https://m.media-amazon.com/images/I/81SRDNUx+kL._UY575_.jpg'
			},
			{
				text: "Lavie Women's Horse Bag | Ladies Purse Handbag",
				affilate_url: 'https://amzn.to/430mBAQ',
				image_url:
					'https://m.media-amazon.com/images/I/61wMesTUMeL._UY575_.jpg'
			},
			{
				text: 'Handbag for Women Fashion Faux Leather',
				affilate_url: 'https://amzn.to/45q23mP',
				image_url:
					'https://m.media-amazon.com/images/I/61g8X6TpAwL._UX679_.jpg'
			},
			{
				text: 'INOVERA (LABEL) Women Handbags Shoulder Hobo Bag Purse With Long Strap',
				affilate_url: 'https://amzn.to/45kxEXb',
				image_url:
					'https://m.media-amazon.com/images/I/71Raw8VUk5L._UY575_.jpg'
			}
		];*/

		async function sendImage(chatGroup) {
			/* let randomProduct = bags[Math.floor(Math.random() * 10)];
			const media = await MessageMedia.fromUrl(randomProduct.image_url);
			client.sendMessage(chatGroup.id._serialized, media, {
				caption: `${randomProduct.text} ${randomProduct.affilate_url}`
			}); */

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
