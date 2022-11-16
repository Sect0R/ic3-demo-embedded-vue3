/**
 * Support for embedding icCube via an iFrame.
 */
export const DashboardsLoaderFrame = function (params) {
    const {containerId, frameId, className, style, onReady, url} = params;
    const containerELT = document.getElementById(containerId);

    if (!containerELT) {
        throw new Error('[ic3loader] (iFrame) missing container [' + containerId + ']');
    }

    // console.log('[Loader] (iFrame) icCube URL : ' + url);
    // console.log('[Loader] (iFrame)  container : ' + containerId);
    // console.log('[Loader] (iFrame)   callback : ' + onReady);

    const wnd = window;

    wnd.ic3loader = wnd.ic3loader || {};

    wnd.ic3loader[containerId] = (ic3) => {
        console.log('[Loader] (iFrame)      ready : ', ic3);
        delete wnd.ic3loader[containerId];
        onReady && onReady(ic3);
    };

    // setup an iFrame passing a url w/   &cb=window.name.of.callback
    //      window. or parent. then in icCube ...
    const iFrame = document.createElement('iframe');

    frameId && (iFrame.id = frameId);
    className && (iFrame.className = className);
    iFrame.width = '100%';
    iFrame.height = '100%';

    if (style) {
        for (const property in style) {
            iFrame.style[property] = style[property];
        }
    } else {
        iFrame.style.border = '0px none';
    }

    const sep = url.indexOf('?') === -1 ? '?' : '&';
    const src = url + sep + 'ic3callback=ic3loader.' + containerId;

    iFrame.setAttribute('src', src);

    console.log('[Loader] (iFrame)     iFrame : ' + src);

    containerELT.appendChild(iFrame);
};

/**
 * Support for embedding icCube via a DIV.
 *
 * icCube uses Webpack: loading the entry point (i.e., main.js) will start loading all initial chunks.
 *
 * You can create this context ASAP. Actually can be done at any point in your app life time before
 * any icCube rendering is required yet.
 */
class DashboardsLoaderFn {
    constructor(options) {
        /**
         * The URL path of the icCube index.html containing the Webpack main entry point (i.e., main.js).
         */
        this.indexHtmlUrl = '/icCube/report/console';

        this.debug = options.debug || false;

        /**
         * Container element where the icCube DIV will be created.
         * @type {*|string|string|HTMLElement}
         */
        this.container = options.container || 'icCubeContainer';

        /**
         * App type: 'viewer' or 'editor'.
         * @type {null|string}
         */
        this.appType = options.appType || 'viewer';

        /**
         *
         * @type {null|function}
         */
        this.resizingContainer = options.resizingContainer || null;
        /**
         * The URL path where icCube Webpack files are located:
         *
         * /icCube/report
         *      app                  -- public path
         *          index.html
         *          main.js
         *          chunks
         *          ...
         *      plugins              -- e.g., amCharts
         *          ...
         *
         */

        this.publicPath = '/icCube/report/app/';
        this.buildVersion = '';
        this.buildTimestamp = '';

        let suffix = '';
        let customHeadersType;
        let configuration;

        if (typeof options === 'string') {
            suffix = options;
        } else if (options) {
            customHeadersType = options.customHeadersType;
            configuration = options.configuration;
            suffix = options.urlSuffix || suffix;
        }

        this.customHeaders = options.customHeaders || null;
        this.customHeadersType = customHeadersType;
        this.configuration = configuration;
        this.indexHtmlUrl += suffix;

        this.mainJsUrl = this.publicPath + 'main.js' + suffix;

        // Start loading all required initial libraries (in the background).
        this.libLoader = this.loadLibs();
    }

    static extractMatch(indexHtml, regExp, error) {
        const match = indexHtml.match(regExp);

        if (match == null || match.length !== 2) {
            if (error != null) {
                throw new Error(error);
            } else {
                return '';
            }
        }

        return match[1];
    }

    getBuildVersion() {
        return this.buildVersion;
    }

    getBuildTimestamp() {
        return this.buildTimestamp;
    }

    getInitializationOptions() {
        return {
            container: this.container,
            appType: this.appType,
            resizingContainer: this.resizingContainer,
        };
    }

    initializeCustomHeaders() {
        if (!this.customHeadersType || !this.customHeaders) {
            return;
        }

        window.addEventListener('message', event => {
            const data = event.data;

            if (data.type === 'ic3-custom-headers-request') {
                const embeddedDiv = (data.ic3callerType === 'div');
                const ic3customheaders = data.ic3customheaders /* as specified in the URL */;

                const target = !embeddedDiv
                    ? document.getElementById('ic3-iframe')?.['contentWindow']
                    : window
                ;

                this.debug && console.info('[CustomHeaders] demo <<< ic3-custom-headers-reply(' + ic3customheaders + ')');

                target && target.postMessage({
                    type: 'ic3-custom-headers-reply',
                    data: {
                        headers: this.customHeaders,
                    },
                }, '*');
            }
        });
    }

    /**
     * Initialize the icCube scripts and custom headers.
     * @return {Promise}
     */
    initialize() {
        this.initializeCustomHeaders();

        return this.loadLibsAndInitialize();
    }

    loadLibsAndInitialize() {
        const options = this.getInitializationOptions();
        const {container, appType, resizingContainer} = options;
        const loader = this.loadLibs();

        return loader.then((starter) => {
            return new Promise((resolve, reject) => {
                const start = performance.now();

                starter(Object.assign(
                    Object.assign({}, options),
                    {
                        appType: appType !== null && appType !== void 0 ? appType : 'viewer',
                        container,
                        resizingContainer,
                        callback: (reporting) => {
                            const timeDiff = Math.round(performance.now() - start);

                            this.debug && console.log('[Loader] (div) loadLibsAndInitialize completed in ' + timeDiff + ' ms.');
                            resolve(reporting);
                        },
                    },
                ));
            });
        }).catch(reason => Promise.reject(reason));
    }

    /**
     * First step load main.js, associated chunks
     */
    loadLibs() {
        if (this.libLoader == null) {
            const wnd = window;
            const start = performance.now();

            this.libLoader = fetch(this.indexHtmlUrl, {cache: 'no-cache'}).then(response => {
                if (!response.ok) {
                    throw new Error(response.status + ':' + response.statusText + ' (' + response.url + ')');
                }
                return response.text();
            }).then(indexHtml => {
                // CSRF code.
                //
                // The server might have been configured with csrfOff=true meaning we should not fail here.
                // Plus that token value is more or less sent (not clear in the server code). So let's use
                // the value we get (anyway an error will be generated later => guess it's fine).
                {
                    const token = ICCubeDashboardsLoader.extractMatch(indexHtml, ICCubeDashboardsLoader.crfCodeRE);

                    token && (wnd['ic3_CSRF_token'] = token);
                }

                // Webpack's entry point (main.js) cache busting key
                let cacheKey = '';

                if (!this.mainJsUrl.includes('?')) {
                    cacheKey = '?' +
                        ICCubeDashboardsLoader.extractMatch(indexHtml, ICCubeDashboardsLoader.mainJsCacheKeyRE, 'Internal Error: missing main.js');
                }
                // Build information
                this.buildVersion = ICCubeDashboardsLoader.extractMatch(indexHtml, ICCubeDashboardsLoader.buildVersionRE);
                this.buildTimestamp = ICCubeDashboardsLoader.extractMatch(indexHtml, ICCubeDashboardsLoader.buildTimestampRE);
                const scriptUrl = this.mainJsUrl + cacheKey;

                // Load Webpack entry point: main.js
                this.debug &&
                console.log('[Loader] (div) start loading library [version:' + this.buildVersion + '] [build:' + this.buildTimestamp + ']');
                wnd['__ic3_div_embedded__'] = true;
                wnd['__ic3_div_webpack_public_path__'] = this.publicPath;
                wnd['__ic3_div_custom_headers__'] = this.customHeadersType;
                wnd['__ic3_div_configuration__'] = this.configuration;
                wnd['__ic3_embedded__'] = true /* embedding a previous version */;
                wnd['__ic3__webpack_public_path__'] = this.publicPath /* embedding a previous version */;

                return ICCubeDashboardsLoader.loadScript(scriptUrl).catch(reason => Promise.reject('Error loading main.js script : ' + scriptUrl));
            }).then(() => {
                this.debug && console.log('[Loader] (div) main.js loaded in ' + Math.round(performance.now() - start) + ' ms');
                let count = 0;

                return new Promise((resolve, reject) => {
                    // Busy wait till icCube has loaded all initial Webpack chunks and initialized itself.
                    (function waitUtil(debug = false) {
                        if (wnd['__ic3_div_embedded_starter__'] !== undefined) {
                            const timeDiff = Math.round(performance.now() - start);

                            debug && console.log('[Loader] (div) scripts ready in ' + timeDiff + ' ms');
                            resolve(wnd['__ic3_div_embedded_starter__']);
                        } else {
                            if (count++ === 4) {
                                debug && console.log('[Loader] (div) scripts : waiting for icCube initialized');
                                count = 0;
                            }
                            setTimeout(waitUtil, 250);
                        }
                    })(this.debug);
                });
            }).catch(reason => {
                let _a;

                return Promise.reject((_a = reason.message) !== null && _a !== void 0 ? _a : reason);
            });
        }
        return this.libLoader;
    }
}

export const ICCubeDashboardsLoader = DashboardsLoaderFn;
ICCubeDashboardsLoader.crfCodeRE = /ic3_CSRF_token = "(.*)"/;
ICCubeDashboardsLoader.mainJsCacheKeyRE = /main\.js\?(.*)">/;
ICCubeDashboardsLoader.buildVersionRE = /ic3_build_version = "(.*)"/;
ICCubeDashboardsLoader.buildTimestampRE = /ic3_build_timestamp = "(.*)"/;
ICCubeDashboardsLoader.loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        script.type = 'text/javascript';
        script.onload = resolve;
        script.onerror = reject;
        script.src = src;

        document.head.append(script);
    });
};
