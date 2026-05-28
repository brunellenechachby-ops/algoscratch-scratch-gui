import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import log from '../lib/log.js';

const onClickLogo = () => {
    window.location = 'https://scratch.mit.edu';
};

const handleTelemetryModalCancel = () => {
    log('User canceled telemetry modal');
};

const handleTelemetryModalOptIn = () => {
    log('User opted into telemetry');
};

const handleTelemetryModalOptOut = () => {
    log('User opted out of telemetry');
};

let algoscratchVm = null;

const ALGOSCRATCH_EXPORT_PROJECT = 'algoscratch:scratch:export-project';
const ALGOSCRATCH_EXPORTED_PROJECT = 'algoscratch:scratch:exported-project';
const ALGOSCRATCH_IMPORT_PROJECT = 'algoscratch:scratch:import-project';
const ALGOSCRATCH_IMPORTED_PROJECT = 'algoscratch:scratch:imported-project';
const ALGOSCRATCH_READY = 'algoscratch:scratch:ready';

const notifyParent = message => {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
    }
};

const setupAlgoscratchBridge = () => {
    if (window.__algoscratchBridgeReady) return;
    window.__algoscratchBridgeReady = true;

    window.addEventListener('message', event => {
        const message = event.data || {};
        if (!message.type || !message.type.startsWith('algoscratch:scratch:')) return;

        const reply = payload => {
            const target = event.source || window.parent;
            if (target) {
                target.postMessage(payload, '*');
            }
        };

        if (!algoscratchVm) {
            reply({
                type: `${message.type}:error`,
                requestId: message.requestId,
                activityId: message.activityId,
                error: 'L’éditeur Scratch n’est pas encore prêt.'
            });
            return;
        }

        if (message.type === ALGOSCRATCH_EXPORT_PROJECT) {
            algoscratchVm.saveProjectSb3()
                .then(blob => reply({
                    type: ALGOSCRATCH_EXPORTED_PROJECT,
                    requestId: message.requestId,
                    activityId: message.activityId,
                    projectBlob: blob
                }))
                .catch(error => reply({
                    type: `${ALGOSCRATCH_EXPORTED_PROJECT}:error`,
                    requestId: message.requestId,
                    activityId: message.activityId,
                    error: error.message || String(error)
                }));
        }

        if (message.type === ALGOSCRATCH_IMPORT_PROJECT) {
            algoscratchVm.loadProject(message.projectData)
                .then(() => reply({
                    type: ALGOSCRATCH_IMPORTED_PROJECT,
                    requestId: message.requestId,
                    activityId: message.activityId
                }))
                .catch(error => reply({
                    type: `${ALGOSCRATCH_IMPORTED_PROJECT}:error`,
                    requestId: message.requestId,
                    activityId: message.activityId,
                    error: error.message || String(error)
                }));
        }
    });
};

const handleAlgoscratchVmInit = vm => {
    algoscratchVm = vm;
    window.__algoscratchVm = vm;
    setupAlgoscratchBridge();
    notifyParent({type: ALGOSCRATCH_READY});
};

/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    GUI.setAppElement(appTarget);

    // note that redux's 'compose' function is just being used as a general utility to make
    // the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
    // ability to compose reducers.
    const WrappedGui = compose(
        AppStateHOC,
        HashParserHOC
    )(GUI);

    // TODO a hack for testing the backpack, allow backpack host to be set by url param
    const backpackHostMatches = window.location.href.match(/[?&]backpack_host=([^&]*)&?/);
    const backpackHost = backpackHostMatches ? backpackHostMatches[1] : null;

    const scratchDesktopMatches = window.location.href.match(/[?&]isScratchDesktop=([^&]+)/);
    let simulateScratchDesktop;
    if (scratchDesktopMatches) {
        try {
            // parse 'true' into `true`, 'false' into `false`, etc.
            simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
        } catch {
            // it's not JSON so just use the string
            // note that a typo like "falsy" will be treated as true
            simulateScratchDesktop = scratchDesktopMatches[1];
        }
    }

    if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
        // Warn before navigating away
        window.onbeforeunload = () => true;
    }

    ReactDOM.render(
        // important: this is checking whether `simulateScratchDesktop` is truthy, not just defined!
        simulateScratchDesktop ?
            <WrappedGui
                canEditTitle
                isScratchDesktop
                showTelemetryModal
                canSave={false}
                onVmInit={handleAlgoscratchVmInit}
                onTelemetryModalCancel={handleTelemetryModalCancel}
                onTelemetryModalOptIn={handleTelemetryModalOptIn}
                onTelemetryModalOptOut={handleTelemetryModalOptOut}
            /> :
            <WrappedGui
                canEditTitle
                backpackVisible
                showComingSoon
                backpackHost={backpackHost}
                canSave={false}
                onVmInit={handleAlgoscratchVmInit}
                onClickLogo={onClickLogo}
            />,
        appTarget);
};
