const express = require('express');
const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();

const port = process.env.PORT || 5000;

app.get('/', function (req, res) {
	res.send({
		success: true,
		message: 'WhatsApp message sent successfully.............222'
	});
});

app.listen(port, '0.0.0.0', function () {
	console.log('App running on port ' + port);
});
