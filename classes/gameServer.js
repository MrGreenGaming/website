class GameServer {
    /**
     *
     * @param {number} id
     * @param {string} identifier
     */
    constructor(id, identifier) {
        this.id = id;
        this.identifier = identifier;

        /**@type {Map<number, GameServerMedium>} */
        this.media = new Map();
    }

    /**
     * Load server
     * @return {Promise<void>}
     */
    load() {
        return new Promise(async (resolve, reject) => {
            log.debug(`Loading game server: ${this.getIdentifier()} (#${this.getId()})`);

            try {
                await this.loadMedia();
            } catch(error) {
                reject(error);
                return;
            }

            resolve();
        });
    }

    /**
     * Load server media
     * @private
     * @return {Promise<void>}
     */
    loadMedia() {
        return new Promise(async (resolve, reject) => {
            let dbMedia;
            try {
                dbMedia = await db.query(`SELECT * FROM \`gameServerMedia\` WHERE \`parentGameServerId\` = ?`, [this.getId()]);
            } catch (error) {
                reject(error);
                return;
            }

            this.getMedia().clear();
            for (const dbMedium of dbMedia) {
                let medium;
                try {
                    medium = await this.processDbMedium(dbMedium);
                } catch (error) {
                    log.warn(error);
                    continue;
                }

                this.getMedia().set(medium.getId(), medium);
            }

            resolve();
        });
    }

    /**
     * Process database medium
     * @private
     * @param {object} dbMedium
     * @return {Promise<GameServerMedium>}
     */
    processDbMedium(dbMedium) {
        return new Promise(async (resolve, reject) => {
            const GameServerMedium = require('./gameServerMedium');
            const medium = new GameServerMedium(dbMedium.gameServerMediumId);
            if (dbMedium.type)
                medium.setType(dbMedium.type);
            if (dbMedium.path)
                medium.setPath(dbMedium.path);
            if (dbMedium.url)
                medium.setUrl(dbMedium.url);

            resolve(medium);
        });
    }

    /**
     * Get server id
     * @return {number} id
     */
    getId() {
        return this.id;
    }

    /**
     * Get server identifier
     * @returns {string} identifier
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * Get media
     * @return {Map<number, GameServerMedium>}
     */
    getMedia() {
        return this.media;
    }

    /**
     * Set title
     * @param {string} title
     */
    setTitle(title) {
        this.title = title;
    }

    /**
     * Get title
     * @return {string} title
     */
    getTitle() {
        return this.title;
    }

    /**
     * Set short description
     * @param {string} shortDescription
     */
    setShortDescription(shortDescription) {
        this.shortDescription = shortDescription;
    }

    /**
     * Get short description
     * @return {string|void} shortDescription
     * @todo Consider checking normal description and shortening it
     */
    getShortDescription() {
        return this.shortDescription;
    }

    /**
     * Set description
     * @param {string} description
     */
    setDescription(description) {
        this.description = description;
    }

    /**
     * Get description
     * @return {string|void} description
     */
    getDescription() {
        return this.description;
    }
}

module.exports = GameServer;