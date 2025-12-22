const fs = require('fs-extra');
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, 'storage');

async function initializeStorage() {
    await fs.ensureDir(STORAGE_ROOT);
    console.log(`File storage initialized at: ${STORAGE_ROOT}`);
}

async function prepareIdeaFolder(userId, ideaId) {
    const ideaPath = path.join(STORAGE_ROOT, userId, ideaId);

    await fs.ensureDir(path.join(ideaPath, 'videos'));
    await fs.ensureDir(path.join(ideaPath, 'images'));

    return ideaPath;
}

async function saveIdeaMetadata(userId, ideaId, data) {
    const ideaPath = await prepareIdeaFolder(userId, ideaId);
    const metaPath = path.join(ideaPath, 'idea_content.json');
    await fs.writeJson(metaPath, data, { spaces: 2 });
}

async function getIdeaFiles(userId, ideaId) {
    const ideaPath = path.join(STORAGE_ROOT, userId, ideaId);
    if (!await fs.pathExists(ideaPath)) return { videos: [], images: [] };

    const vPath = path.join(ideaPath, 'videos');
    const iPath = path.join(ideaPath, 'images');

    await fs.ensureDir(vPath);
    await fs.ensureDir(iPath);

    const videos = await fs.readdir(vPath);
    const images = await fs.readdir(iPath);

    return { videos, images };
}

module.exports = {
    initializeStorage,
    prepareIdeaFolder,
    saveIdeaMetadata,
    getIdeaFiles,
    STORAGE_ROOT
};
