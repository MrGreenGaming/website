const Express = require('express');
const router = module.exports = Express.Router(undefined);

router.use((error, req, res, next) => {
    if (!error.status)
        error.status = 500;

    res.status(error.status);
    res.json({
        error: error.status,
        generated: new Date()
    });
});

/**
 * API verification
 */
router.use('/', async (req, res, next) => {
    /**
     *
     * @param {number} [errorCode=0]
     * @param {string} [errorMessage]
     */
    const deny = (errorCode, errorMessage) => {
        res.status(500);
        res.json({
            error: errorCode ? errorCode : 0,
            errorMessage: errorMessage ? errorMessage : 'No API access'
        });
    };

    //Check app id presence
    const appId = req.body.appId = typeof(req.body.appId) === 'number' ? req.body.appId : typeof(req.body.appId) === 'string' ? parseInt(req.body.appId, 10) : undefined;
    if (isNaN(appId)) {
        deny(1, 'Invalid App ID');
        return;
    }

    //Check app secret presence
    if (typeof(req.body.appSecret) !== 'string' || !req.body.appSecret) {
        deny(2, 'Invalid App Secret');
        return;
    }

    const apiApp = ApiApps.get(appId);
    if (!apiApp) {
        deny(3, 'App not available or secret doesn\'t match');
        return;
    }

    let isMatch;
    try {
        isMatch = await apiApp.verifySecretMatch(req.body.appSecret);
    } catch (error) {
        log.error(error);
        deny(3, 'Internal error occurred when verifying app');
        return;
    }

    if (!isMatch) {
        deny(3, 'App not available or secret doesn\'t match');
        return;
    }

    next();
});

router.post('/', (req, res) => {
    res.json({
        helloWorld: 'Hi!',
        generated: new Date()
    });
});

router.use('/account', require('./api/account'));
router.use('/users', require('./api/users'));

//Catch all for 404 error
router.all('*', (req, res) => {
    const errorStatusCode = 404;
    res.status(errorStatusCode);
    res.json({
        error: errorStatusCode,
        generated: new Date()
    });
});