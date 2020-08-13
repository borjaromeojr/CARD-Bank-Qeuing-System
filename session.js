var aSessions = [];

function addSession(id, type) {
    const session = { id, type };
    aSessions.push(session);
    return session;
}

function getSession(id) {
    return aSessions.find(session => session.id === id);
}

function removeSession(id) {
    const index = aSessions.findIndex(session => session.id === id);
    if (index !== -1) {
        return aSessions.splice(index, 1)[0];
    } else {
        return undefined;
    }
}

function getSessions() {
    return aSessions;
}

module.exports = {
    addSession,
    getSessions,
    getSession,
    removeSession
};