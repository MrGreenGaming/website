/** @type {Map<number, Game>} */
const gamesById = new Map();
/** @type {Map<string, Game>} */
const gamesByIdentifier = new Map();

const reloadTime = 600;

class Games {
    /**
     * Load games
     * @return {Promise<void>}
     */
    static load() {
        return new Promise(async (resolve, reject) => {
            log.debug('Loading games');

            let dbGames;
            try {
                dbGames = await db.query(`SELECT * FROM \`games\``);
            } catch (error) {
                reject(error);
                return;
            }

            gamesById.clear();
            gamesByIdentifier.clear();

            for (const dbGame of dbGames) {
                let game;
                try {
                    game = await this.processDbGame(dbGame);
                } catch (error) {
                    log.warn(error);
                    continue;
                }

                gamesById.set(game.getId(), game);
                gamesByIdentifier.set(game.getIdentifier(), game);
            }

            //Next reload
            setTimeout(async () => {
                try {
                    await this.load();
                } catch(error) {
                    log.error(error);
                }
            }, reloadTime * 1000);

            resolve();
        });
    }

    /**
     * Process database game
     * @private
     * @param {object} dbGame
     * @return {Promise<Game>} game
     */
    static processDbGame(dbGame) {
        return new Promise(async (resolve, reject) => {
            const Game = require('../classes/game');
            const game = new Game(dbGame.gameId, dbGame.identifier);
            game.parseDb(dbGame);

            try {
                await game.load();
            } catch (error) {
                reject(error);
                return;
            }

            resolve(game);
        });
    }

    /**
     * Get all games
     * @return {Set<Game>}
     */
    static getAll() {
        return new Set(gamesById.values());
    }

    /**
     * Get by id or identifier
     * @param {number|string} identifier
     * @returns {Game|void} game
     */
    static get(identifier) {
        if (typeof(identifier) === 'number' && identifier)
            return gamesById.get(identifier);
        else if (typeof(identifier) === 'string' && identifier)
            return gamesByIdentifier.get(identifier);
    }
}

module.exports = Games;