const Express = require('express');
const router = module.exports = Express.Router(undefined);

/**
 * API verification
 */
router.all('/', async (req, res, next) => {
    const deny = () => {
        res.json({
            error: 1,
            errorMessage: 'No API access'
        });
    };

    if (typeof(req.body.appSecret) !== 'string' || !req.body.appSecret) {
        deny();
        return;
    }

    const appId = req.body.appId = typeof(req.body.appId) === 'number' ? req.body.appId : typeof(req.body.appId) === 'string' ? parseInt(req.body.appId, 10) : undefined;
    if (isNaN(appId)) {
        deny();
        return;
    }

    const apiApp = ApiApps.get(appId);
    if (!apiApp) {
        deny();
        return;
    }

    let isMatch;
    try {
        isMatch = await apiApp.verifySecretMatch(req.body.appSecret);
    } catch (error) {
        log.error(error);
        deny();
        return;
    }

    if (!isMatch)
        deny();

    next();
});

router.use('/accounts', require('./api/account'));
router.use('/users', require('./api/users'));