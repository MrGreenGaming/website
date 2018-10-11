const Express = require('express');
const router = module.exports = Express.Router({
    strict: App.express.get('strict routing'),
    caseSensitive: App.express.get('case sensitive routing')
});

const mollie = require('@mollie/api-client')({
    apiKey: Config.mollie.apiKey
});

router.get('/', (req, res) => {
    res.redirect('/account');
});

router.get('/buy', (req, res) => {
    if (!req.user) {
        res.redirect('/account');
        return;
    }

    const template = require('../views/greencoins/buy.marko');
    res.marko(template, {
        page: {
            title: 'Buy GreenCoins',
            description: 'Buy GreenCoins and spend them in our game servers.',
            path: App.getExpressPath(req.baseUrl, req.path)
        },
        amounts: {
            min: Config.mollie.minAmount,
            max: Config.mollie.maxAmount,
            default: Config.mollie.defaultAmount,
        },
        exchangeRate: Config.mollie.gcExchangeRate
    });
});

router.get('/payment/failed', (req, res) => {
    const template = require('../views/greencoins/paymentFailed.marko');
    res.marko(template, {
        page: {
            title: 'GreenCoins payment failed',
            description: 'A GreenCoins payment failed.',
            path: App.getExpressPath(req.baseUrl, req.path)
        },
        reason: req.query.reason
    });
});

router.get('/payment', async (req, res) => {
    const templateData = {
        page: {
            title: 'GreenCoins payment information',
            description: 'Information is available on a GreenCoins payment.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    };

    //Get user from query parameter
    let user;
    if (typeof(req.query.userId) === 'string') {
        const userId = parseInt(req.query.userId, 10);
        if (!isNaN(userId)) {
            try {
                user = await Users.get(userId);
            } catch (error) {
                log.warn(error);
            }
        }
    }
    if (!user) {
        res.redirect('./payment/failed?reason=invalidUser');
        return;
    }

    //Get payment from query parameter
    let payment;
    if (typeof(req.query.paymentId) === 'string') {
        const paymentId = parseInt(req.query.paymentId);
        if (!isNaN(paymentId)) {
            try {
                const results = await db.query(`SELECT \`parentUserId\`, \`status\`, \`mollieIdentifier\`, \`greenCoinsAmount\` FROM \`coinsPayments\` WHERE \`paymentId\` = ?`, [paymentId]);
                if (results && results[0])
                    payment = results[0];
            } catch (error) {
                log.error(error);
            }
        }
    }
    if (!payment) {
        res.redirect('./payment/failed?reason=invalidPayment');
        return;
    } else if (payment.parentUserId !== user.getId()) {
        res.redirect('./payment/failed?reason=invalidUser');
        return;
    }

    templateData.greenCoinsAmount = payment.greenCoinsAmount;
    templateData.status = payment.status;
    if (templateData.status === 'open') {
        let molliePayment;
        try {
            molliePayment = await mollie.payments.get(payment.mollieIdentifier);
        } catch(error) {
            log.warn(error);
            res.redirect('./payment/failed?reason=psp');
            return;
        }

        if (!molliePayment) {
            res.redirect('./payment/failed?reason=psp');
            return;
        }

        if (molliePayment.isCanceled())
            templateData.status = 'canceled';
        else if (molliePayment.isExpired())
            templateData.status = 'expired';
        else if (molliePayment.isPaid())
            templateData.status = 'paid';
    }

    const template = require('../views/greencoins/paymentCompleted.marko');
    res.marko(template, templateData);
});

router.post('/buy', async (req, res, next) => {
    if (!req.user) {
        res.redirect('/account');
        return;
    }

    const amount = parseFloat(req.body.amount);
    if (isNaN(amount)) {
        log.warn(new Error('Invalid amount entered'));
        res.redirect('./payment/failed?reason=amountNaN');
        return;
    } else if (amount < Config.mollie.minAmount) {
        log.warn(new Error('Invalid amount entered. Below minimum.'));
        res.redirect('./payment/failed?reason=minAmount');
        return;
    } else if (amount > Config.mollie.maxAmount) {
        log.warn(new Error('Invalid amount entered. Above maximum.'));
        res.redirect('./payment/failed?reason=maxAmount');
        return;
    }

    const amountCents = Math.floor(amount * 100);
    const greenCoinsAmount = (amountCents / 100) * Config.mollie.gcExchangeRate;
    const amountString = amount.toFixed(2);

    //Add to users table
    const dbData = {
        parentUserId: req.user.getId(),
        status: 'open',
        amount: amountString,
        amountCents,
        greenCoinsAmount
    };

    let insertResults;
    try {
        insertResults = await db.query(`INSERT INTO \`coinsPayments\` SET ?`, [dbData]);
    } catch(error) {
        log.error(error);
        res.redirect('./payment/failed');
        return;
    }

    const paymentId = insertResults.insertId;

    let molliePayment;
    try {
        molliePayment = await mollie.payments.create({
            amount: {
                value: amountString,
                currency: 'EUR'
            },
            description: `${greenCoinsAmount.toLocaleString()} GreenCoins (order #${paymentId})`,
            //customerId: `cst_${req.user.getId().toString(10)}`,
            metadata: {
                userId: req.user.getId(),
                paymentId
            },
            redirectUrl: `${Config.site.publicUrl}/greencoins/payment?userId=${req.user.getId()}&paymentId=${paymentId}`,
            //webhookUrl: `${Config.site.publicUrl}/greencoins/payment/webhook`,
            webhookUrl: `http://google.nl`
        });
    } catch(error) {
        log.error(error);
        res.redirect('./payment/failed?reason=psp');
        return;
    }

    const mollieIdentifier = molliePayment.id;

    try {
        await db.query(`UPDATE \`coinsPayments\` SET ? WHERE \`paymentId\` = ?`, [{
            mollieIdentifier
        }, paymentId]);
    } catch(error) {
        log.error(error);
        res.redirect('./payment/failed');
        return;
    }

    log.info(`Directing user #${req.user.getId()} to Mollie for payment ID ${paymentId} (Mollie identifier ${mollieIdentifier}}`);

    res.redirect(molliePayment.getPaymentUrl());
});