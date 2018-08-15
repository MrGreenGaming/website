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

    if (typeof(req.body.appId) !== 'string' || typeof(req.body.appSecret) !== 'string' || !req.body.appSecret)
        return deny();

    const appId = req.body.appId = parseInt(req.body.appId);
    if (isNaN(appId))
        return deny();

    const apiApp = ApiApps.get(appId);
    if (!apiApp)
        return deny();

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