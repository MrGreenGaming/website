class Game {
    /**
     *
     * @param {number} id
     * @param {string} identifier
     */
    constructor(id, identifier) {
        this.id = id;
        this.identifier = identifier;

        /** @type {Map<number, GameServer>} */
        this.serversById = new Map();
        /** @type {Map<string, GameServer>} */
        this.serversByIdentifier = new Map();
    }

    /**
     * Load game
     * @return {Promise<void>}
     */
    load() {
        return new Promise(async (resolve, reject) => {
            log.debug(`Loading game: ${this.getIdentifier()} (#${this.getId()})`);
            try {
                await this.loadServers();
            } catch (error) {
                reject(error);
                return;
            }

            resolve();
        });
    }

    /**
     * Load game servers
     * @private
     * @return {Promise<void>}
     */
    loadServers() {
        return new Promise(async (resolve, reject) => {
            this.getServers().clear();

            let dbServers;
            try {
                dbServers = await db.query(`SELECT * FROM \`gameServers\` WHERE \`parentGameId\` = ?`, [this.getId()]);
            } catch (error) {
                reject(error);
                return;
            }

            this.serversById.clear();
            this.serversByIdentifier.clear();
            for (const dbServer of dbServers) {
                let server;
                try {
                    server = await this.processDbServer(dbServer);
                } catch (error) {
                    log.warn(error);
                    continue;
                }

                this.serversById.set(server.getId(), server);
                this.serversByIdentifier.set(server.getIdentifier(), server);
            }

            resolve();
        });
    }

    /**
     * Process database server
     * @private
     * @param {object} dbServer
     * @return {Promise<GameServer>}
     */
    processDbServer(dbServer) {
        return new Promise(async (resolve, reject) => {
            const GameServer = require('./gameServer');
            const server = new GameServer(dbServer.gameServerId, dbServer.identifier);
            if (dbServer.title)
                server.setTitle(dbServer.title);
            if (dbServer.shortDescription)
                server.setShortDescription(dbServer.shortDescription);
            if (dbServer.description)
                server.setDescription(dbServer.description);

            try {
                await server.load();
            } catch (error) {
                reject(error);
                return;
            }

            resolve(server);
        });
    }

    /**
     * Get game id
     * @return {number} id
     */
    getId() {
        return this.id;
    }

    /**
     * Get game identifier
     * @returns {string} identifier
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * Get all game servers
     * @return {Set<GameServer>}
     */
    getServers() {
        return new Set(this.serversById.values());
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
     * Set logo path
     * @param {string} logoPath
     */
    setLogoPath(logoPath) {
        this.logoPath = logoPath;
        delete this.cachedLogoUrl;
    }

    /**
     * Get logo path
     * @return {string|void} logoPath
     */
    getLogoPath() {
        return this.logoPath;
    }

    /**
     * Get logo url
     * @return {string}
     */
    getLogoUrl() {
        if (this.cachedLogoUrl)
            return this.cachedLogoUrl;
        else
            return this.cachedLogoUrl = this.logoPath.replace('$GAME', this.getIdentifier());
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

module.exports = Game;