const Express = require('express');
const router = module.exports = Express.Router({
    strict: App.express.get('strict routing'),
    caseSensitive: App.express.get('case sensitive routing')
});

router.get('/', (req, res) => {
    const template = require('../views/index.marko');
    res.marko(template, {
        page: {
            title: 'Mr. Green Gaming',
            overrideTitle: true,
            description: 'Mr. Green Gaming is an online games community started in 2006. Several gameservers are hosted to players worldwide.',
            path: App.getExpressPath(req.baseUrl, req.path)
        },
        newsItems: CommunityNews.getItems()
    });
});

router.get('/about', (req, res) => {
    const template = require('../views/about.marko');
    res.marko(template, {
        page: {
            title: 'About',
            description: 'About the Mr. Green Gaming community and it\'s history which started back in 2006.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

router.get('/faq', (req, res) => {
    const template = require('../views/faq.marko');
    res.marko(template, {
        page: {
            title: 'FAQ',
            description: 'Frequently Asked Questions about Mr. Green Gaming answered.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});

router.get('/greencoins', (req, res) => {
    const template = require('../views/greencoins/index.marko');
    res.marko(template, {
        page: {
            title: 'GreenCoins',
            description: 'GreenCoins allow Mr. Green Gaming players to buy in-game items such as cosmetic items.',
            path: App.getExpressPath(req.baseUrl, req.path)
        }
    });
});