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
        if (dbResult.logoPath)
            this.setLogoPath(dbResult.logoPath);
        if (dbResult.hostConnectFormat)
            this.setHostConnectFormat(dbResult.hostConnectFormat);
        if (dbResult.hostDisplayFormat)
            this.setHostDisplayFormat(dbResult.hostDisplayFormat);
        if (dbResult.defaultPublicPort)
            this.setDefaultPublicPort(dbResult.defaultPublicPort);
        if (dbResult.defaultQueryPort)
            this.setDefaultQueryPort(dbResult.defaultQueryPort);
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
                const GameServer = require('./gameServer');
                const server = new GameServer(this, dbServer.gameServerId, dbServer.identifier);
                server.parseDb(dbServer);

                try {
                    await server.load();
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
        return this.description || this.shortDescription;
    }

    /**
     * Set default public port
     * @param {number} publicPort
     */
    setDefaultPublicPort(publicPort) {
        this.defaultPublicPort = publicPort;
    }

    /**
     * Get default public port
     * @return {number|void} publicPort
     */
    getDefaultPublicPort() {
        return this.defaultPublicPort;
    }

    /**
     * Set default query port
     * @param {number} queryPort
     */
    setDefaultQueryPort(queryPort) {
        this.defaultQueryPort = queryPort;
    }

    /**
     * Get default query port
     * @return {number|void} queryPort
     */
    getDefaultQueryPort() {
        return this.defaultQueryPort;
    }

    /**
     * Set host display format
     * @param {string} hostDisplayFormat
     */
    setHostDisplayFormat(hostDisplayFormat) {
        this.hostDisplayFormat = hostDisplayFormat;
    }

    /**
     * Get host display format
     * @return {string|void} hostDisplayFormat
     */
    getHostDisplayFormat() {
        return this.hostDisplayFormat;
    }

    /**
     * Set host connect format
     * @param {string} hostConnectFormat
     */
    setHostConnectFormat(hostConnectFormat) {
       this.hostConnectFormat =  hostConnectFormat;
    }

    /**
     * Get host connect format
     * @return {string|void} hostConnectFormat
     */
    getHostConnectFormat() {
        return this.hostConnectFormat;
    }

    /**
     * Get host connect URL
     * @param {string} address
     * @param {number} [publicPort]
     * @param {number} [queryPort]
     * @returns {string|void} hostConnectUrl
     */
    getHostConnectUrl(address, publicPort, queryPort) {
        const hostConnectFormat = this.getHostConnectFormat();
        if (!hostConnectFormat)
            return;

        return Game.hostReplacer(hostConnectFormat, address, publicPort, queryPort);
    }

    /**
     * Get host display text
     * @param {string} address
     * @param {number} [publicPort]
     * @param {number} [queryPort]
     * @returns {string|void} hostDisplayText
     */
    getHostDisplayText(address, publicPort, queryPort) {
        const hostDisplayFormat = this.getHostDisplayFormat();
        if (!hostDisplayFormat)
            return;

        return Game.hostReplacer(hostDisplayFormat, address, publicPort, queryPort);
    }

    /**
     * Get host connect URL
     * @param {string} format
     * @param {string} address
     * @param {number} [publicPort]
     * @param {number} [queryPort]
     * @returns {string|void} hostConnectUrl
     */
    static hostReplacer(format, address, publicPort, queryPort) {
        format = format.replace('$ADDRESS', address);
        format = format.replace('$PUBLICPORTCOLON', publicPort ? ':' : '');
        format = format.replace('$PUBLICPORT', publicPort ? publicPort : '');
        format = format.replace('$QUERYPORTCOLON', queryPort ? ':' : '');
        return format.replace('$QUERYPORT', queryPort ? queryPort : '');
    }
}

module.exports = Game;