const Express = require('express');
const router = Express.Router(undefined);

router.get('/', async (req, res, next) => {
    const template = require('../views/games/index.marko');
    res.marko(template, {
        page: {
            title: 'Games',
            description: 'An overview of the games we play at the Mr. Green Gaming community.',
            path: App.getExpressPath(req.baseUrl, req.path)
        },
        games: Games.getAll()
    });
});

router.param('gameIdentifier', async (req, res, next, gameIdentifier) => {
    if (!gameIdentifier || gameIdentifier.length > 200) {
        next(new Error('Invalid game.'));
        return;
    }

    const game = req.game = Games.get(gameIdentifier);
    if (!game) {
        const error = new Error('Unable to find game.');
        error.status = '404';
        next(error);
        return;
    }

    next();
});

router.get('/:gameIdentifier', async (req, res, next) => {
    const template = require('../views/games/game.marko');
    res.marko(template, {
        page: {
            title: req.game.title,
            description: req.game.shortDescription ? req.game.shortDescription : `${req.game.title} is one of the games we play at the Mr. Green Gaming community.`,
            path: App.getExpressPath(req.baseUrl, req.path)
        },
        game: req.game
    });
});

module.exports = router;
