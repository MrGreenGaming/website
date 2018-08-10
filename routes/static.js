const Express = require('express');
const router = Express.Router(undefined);

router.get('/', (req, res, next) => {
    const template = require('../views/index.marko');
    res.marko(template, {
        page: {
            title: 'Mr. Green Gaming',
            overrideTitle: true,
            description: 'Mr. Green Gaming is an online games community started in 2006. Several gameservers are hosted to players worldwide.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

router.get('/about', (req, res, next) => {
    const template = require('../views/about.marko');
    res.marko(template, {
        page: {
            title: 'About',
            description: 'About the Mr. Green Gaming community and it\'s history which started back in 2006.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

router.get('/faq', (req, res, next) => {
    const template = require('../views/faq.marko');
    res.marko(template, {
        page: {
            title: 'FAQ',
            description: 'Frequently Asked Questions about Mr. Green Gaming answered.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

module.exports = router;