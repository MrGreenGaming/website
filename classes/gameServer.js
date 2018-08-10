class GameServer {
    /**
     *
     * @param {Game} game
     * @param {number} id
     * @param {string} identifier
     */
    constructor(game, id, identifier) {
        this.game = game;
        this.id = id;
        this.identifier = identifier;

        /**@type {Map<number, GameServerMedium>} */
        this.media = new Map();
    }

    /**
     * Parse database result
     * @param {object} dbResult
     */
    parseDb(dbResult) {
        if (dbResult.title)
            this.setTitle(dbResult.title);
        if (dbResult.shortDescription)
            this.setShortDescription(dbResult.shortDescription);
        if (dbResult.description)
            this.setDescription(dbResult.description);
        if (dbResult.hostAddress)
            this.setHost(dbResult.hostAddress, dbResult.hostPublicPort, dbResult.hostQueryPort);
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
     * Get parent game
     * @return {Game}
     */
    getGame() {
        return this.game;
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
     * Set host
     * @param {string} address
     * @param {number} [publicPort]
     * @param {number} [queryPort]
     */
    setHost(address, publicPort, queryPort) {
        this.host = {
            address,
            publicPort,
            queryPort
        };

        delete this.cachedHostConnectUrl;
        delete this.cachedHostDisplayText;
    }

    /**
     * Get host address, public port and query port
     * @return {{address: string, publicPort: number, queryPort: number}|void}
     */
    getHost() {
        return this.host;
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
        return this.description || this.shortDescription;
    }

    /**
     * Get host connect url
     * @return {string|void} hostConnectUrl
     */
    getHostConnectUrl() {
        if (this.cachedHostConnectUrl)
            return this.cachedHostConnectUrl;

        const host = this.getHost();
        if (!host) {
            delete this.cachedHostConnectUrl;
            return;
        }

        return this.cachedHostConnectUrl = this.getGame().getHostConnectUrl(host.address, host.publicPort, host.queryPort);
    }

    /**
     * Get host display text
     * @return {string|void} hostDisplayText
     */
    getHostDisplayText() {
        if (this.cachedHostDisplayText)
            return this.cachedHostDisplayText;

        const host = this.getHost();
        if (!host) {
            delete this.cachedHostDisplayText;
            return;
        }

        return this.cachedHostDisplayText = this.getGame().getHostDisplayText(host.address, host.publicPort, host.queryPort);
    }

    /**
     * Check host validity
     * @return {boolean} validity
     */
    isHostValid() {
        const host = this.getHost();
        return typeof(host) === 'object' && typeof(host.address) === 'string' && host.address;
    }
}

module.exports = GameServer;