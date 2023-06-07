const express = require('express');
const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
// Require database
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
//telegram package
const telegram = require('telegram-bot-api');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send({
		success: true,
		message: 'App working fine........................2:00 PM'
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
mongoose.connect(
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
		console.log('ready.....................');
		scheduleJobForGf();
		scheduleJobForAd();
		scheduleJobForFd();
	});

	function scheduleJobForGf() {
		console.log('scheduleJobForGf...............');
		schedule.scheduleJob('*/1 * * * *', function () {
			const groupName = 'GirlsFab';

			client.getChats().then(function (chats) {
				const chatGroup = chats.find(
					(chat) => chat.name == groupName
				); 

				if (chatGroup && chatGroup.groupMetadata && chatGroup.groupMetadata.id && chatGroup.groupMetadata.id._serialized) {
					sendImage(chatGroup, groupName);
				}
			});
		});
	}
	function scheduleJobForAd() {
		schedule.scheduleJob('*/2 * * * *', function () {
			const groupName = 'Amazon deals';

			client.getChats().then(function (chats) {
				const chatGroup = chats.find(
					(chat) => chat.name == groupName
				);
				if (chatGroup && chatGroup.id && chatGroup.id._serialized) {
					sendImage(chatGroup, groupName);
				}
			});
		});
	}
	function scheduleJobForFd() {
		schedule.scheduleJob('*/3 * * * *', function () {
			const groupName = 'Flipkart deals';

			client.getChats().then(function (chats) {
				const chatGroup = chats.find(
					(chat) => chat.name == groupName
				);
				if (chatGroup && chatGroup.id && chatGroup.id._serialized) {
					sendImage(chatGroup, groupName);
				}
			});
		});
	}

	async function sendImage(chatGroup, groupName) {
		try {
			let randomProduct = await PRODUCTS.find({
				source: groupName.toLowerCase()
			}).limit(1);
			if (randomProduct && randomProduct.length > 0) {
				let retData = randomProduct[0];

				const media = await MessageMedia.fromUrl(
					retData.image_url[0]
				);
				client.sendMessage(chatGroup.id._serialized, media, {
					caption: `${retData.title} ${retData.purchase_url}`
				});

				//deleteAfterSent(retData.product_id);
				console.log(groupName);
				if (groupName == 'GirlsFab') {
					console.log('111...........');
					var api = new telegram({
						token: '6158204123:AAGoADPhxzS8wQGO8DeLWwZr6g8gpoQbSLo',
						async_requests: true,
						updates: {
							enabled: true,
							get_interval: 1000
						}
					});

					api.sendPhoto({
						chat_id: '@' + groupName, //'@GirlsFab',
						caption: `${retData.title} ${retData.purchase_url}`,
						photo: retData.image_url[0]
					}).then(function (data) {
						deleteAfterSent(retData.product_id);
					});
				} else {
					console.log('222...........');
					deleteAfterSent(retData.product_id);
				}
			}
		} catch (err) {}
	}

	async function deleteAfterSent(productId) {
		const result = await PRODUCTS.findOneAndDelete({
			product_id: productId
		});
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

app.post('/:source/:id', async function (req, res) {
	var productId = req.params.id,
		source = req.params.source,
		dataObj = {};
	const url = `https://www.amazon.in/dp/${productId}`;

	try {
		const result = await PRODUCTS.find({ product_id: productId });
		if (result.length > 0) {
			res.json({
				success: true,
				message: 'Product already exists'
			});
		} else {
			/* // Fetch HTML of the page we want to scrape
			const { data } = await axios.get(url);
			// Load HTML we fetched in the previous line
			const $ = cheerio.load(data, {
				decodeEntities: true
			});

			dataObj.title = $('#productTitle').text().trim();
			dataObj.price = $('.a-price-whole').text().split('.')[0];
			dataObj.brand = $('#bylineInfo')
				.text()
				.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
			dataObj.brand_url =
				'https://www.amazon.in' + $('#bylineInfo').attr('href');

			dataObj.purchase_url = `${url}?tag=girlsfab-21&language=en_IN`;

			dataObj.availability_status = $('#availability')
				.children('span')
				.text()
				.trim();

			dataObj.small_description = [];

			$('#feature-bullets>ul>li>span').each((i, el) => {
				dataObj.small_description.push(
					$(el)
						.text()
						.replace(/[\n\t]/g, '')
						.trim()
				);
			});

			dataObj.product_information = {};
			const listInfoItems = $('#productOverview_feature_div table tr');
			listInfoItems.each((idx, el) => {
				var evenInfo = $(el)
					.children('td:even')
					.children('span')
					.text();
				var oddInfo = $(el).children('td:odd').children('span').text();
				dataObj.product_information[evenInfo] = oddInfo;
			});

			dataObj.images = [];

			const list = $('#altImages>ul>li');
			list.each((idx, el) => {
				if ($(el).find('img').attr('src') != undefined) {
					var newUrl = formattedImageUrl(
						$(el).find('img').attr('src')
					);
					if (newUrl != '') {
						dataObj.images.push(newUrl);
					}
				}
			}); */ 

			const browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				ignoreDefaultArgs: ['--disable-extensions']
			});
		
			// Open a new page
			const page = await browser.newPage();

			await page.goto(url, {
				waitUntil: "domcontentloaded",
			}); 

			const dataObj = await page.evaluate(() => {
				let responseObj = {};
				
				responseObj.title = document.querySelector('#productTitle').innerText;
				 
				const descriptionArray = document.querySelector('#feature-bullets'),
					liObj = descriptionArray.querySelector('ul').querySelectorAll('li'),
					descArray = [];
		
				Array.from(liObj).map((quote) => {
					descArray.push(quote.querySelector("span").innerText); 
				});
		
				responseObj.small_description = descArray; 
		
				responseObj.image_url = []; 
		
				const list = document.querySelector('#altImages'),
					imgList = list.querySelector('ul').querySelectorAll('li');
				
				const imagesData = [];
				for (const child of imgList) {
					var imgObj = child.querySelector('img');
					if(imgObj && imgObj.hasAttribute('src')){
						var srcUrl = imgObj.getAttribute('src');
						var dataArray = srcUrl.split('.');
						if (dataArray['4'] == 'jpg') {
							dataArray['3'] = '_SX500_';
							var formattedUrl = dataArray.join('.'); 
							imagesData.push(formattedUrl);
						}
					}
				}
				responseObj.images = imagesData; 
		
				responseObj.brand_url = 'https://www.amazon.in' + document.querySelector('#bylineInfo').getAttribute('href');
				//responseObj.purchase_url = url+'?tag=girlsfab-21&language=en_IN';
				responseObj.purchase_url = '?tag=girlsfab-21&language=en_IN';
				responseObj.price = document.querySelector('.a-price-whole').innerText.split('.')[0].replace(/[\n\t]/g, '').trim();
				
				let elem = document.querySelector('#availability'),
					children = elem?.children; 
				responseObj.availability_status = children[0].innerHTML ? children[0].innerHTML.replace(/[\n\t]/g, '').trim() : '';
				
				return responseObj;
			});

			await browser.close();

			var newProduct = new PRODUCTS({
				title: dataObj.title,
				product_id: productId,
				description: dataObj.small_description[0],
				created_date: new Date().toISOString(),
				image_url: dataObj.images,
				brand_url: dataObj.brand_url,
				purchase_url: url + dataObj.purchase_url,
				price: dataObj.price,
				source: source,
				is_active:
					dataObj.availability_status == 'In stock' ? true : false
			});

			const result = await PRODUCTS.find({ product_id: productId });
			if (result.length > 0) {
				res.json({
					success: true,
					message: 'Product already exists'
				});
			} else {
				var retData = await newProduct.save();
				res.json({
					success: true,
					data: retData
				});
			}
		}
	} catch (err) {
		res.json({
			success: false,
			message: err.message
		});
	}
});

app.patch('/:id', async function (req, res) {
	var productId = req.params.id;
	try {
		const updatedProduct = await PRODUCTS.findOneAndUpdate(
			{ product_id: productId },
			req.body,
			{
				new: true
			}
		);

		if (updatedProduct) {
			res.json({ success: true, data: updatedProduct });
		} else {
			res.json({ success: false, message: 'No product found' });
		}
	} catch (err) {
		res.json({
			success: false,
			message: err.message
		});
	}
});

app.delete('/:id', async function (req, res) {
	var productId = req.params.id;
	const result = await PRODUCTS.findOneAndDelete({ product_id: productId });
	if (!result) {
		res.json({
			success: false,
			message: 'Product not found'
		});
	} else {
		res.json({
			success: true,
			message: 'Product deleted successfully'
		});
	}
});

app.get('/products/all', async function (req, res) {
	try {
		const productsData = await PRODUCTS.find({});
		res.send({
			total: productsData.length,
			data: productsData
		});
	} catch (err) {
		res.status(500).send(err);
	}
});

function formattedImageUrl(url) {
	var dataArray = url.split('.');
	if (dataArray['4'] == 'jpg') {
		dataArray['3'] = '_SX500_';
		var formattedUrl = dataArray.join('.');
		return formattedUrl;
	} else {
		return '';
	}
}

app.listen(port, '0.0.0.0', function () {
	console.log('App running on port ' + port);
});
