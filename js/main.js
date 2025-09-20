import TrailSyncApp from './app.js';

const mountTrailSync = () => {
    if (window.__trailSyncApp instanceof TrailSyncApp) {
        return window.__trailSyncApp;
    }
    if (window.__trailSyncApp) {
        return window.__trailSyncApp;
    }
    try {
        const app = new TrailSyncApp();
        window.__trailSyncApp = app;
        return app;
    } catch (error) {
        console.error('[TrailSync init failed]', error);
        return null;
    }
};

const start = () => {
    if (window.__TrailSyncBooted) {
        if (!window.__trailSyncApp) {
            mountTrailSync();
        }
        return;
    }
    window.__TrailSyncBooted = true;
    mountTrailSync();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}

export default TrailSyncApp;
