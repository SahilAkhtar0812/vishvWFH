
(() => {


    'use strict';




    const CONFIG = Object.freeze({


       

        pixelId: '1720798543382512',


        /*
         * Telegram Group
         */

        telegramUrl:

            'https://t.me/+K_tGgsXB3rkxMjY1',


        /*
         * Visitor needs interaction + this time
         * before PageView can qualify.
         */

        pageViewDelayMs:

            3000,


        /*
         * Passive visitor qualifies after this time.
         */

        passiveReaderDelayMs:

            8000,


        /*
         * Prevent extremely fast Telegram clicks
         * from counting as Subscribe.
         */

        minimumClickTimeMs:

            1000,


        /*
         * Give Meta some time to send Subscribe
         * before leaving the page.
         */

        trackedRedirectDelayMs:

            700,


        /*
         * Unqualified clicks redirect almost
         * immediately.
         */

        fastRedirectDelayMs:

            50,


        /*
         * Prevent duplicate PageView
         * inside same browser tab/session.
         */

        pageViewSessionKey:

            'gujarati_trader_qualified_page_view'


    });



    /* =====================================================
       PAGE STATE
    ====================================================== */

    const pageOpenedAt = Date.now();


    let pageViewTracked = false;


    let subscribeTracked = false;


    let navigationStarted = false;


    let humanInteractionDetected = false;



    /* =====================================================
       LOAD META PIXEL
    ====================================================== */

    function loadMetaPixel() {


        const pixelGuardKey =

            `__gujaratiTraderPixelInitialized_${CONFIG.pixelId}`;



        /*
         * Load Facebook Pixel library.
         */

        !function(f, b, e, v, n, t, s) {


            if(f.fbq) {

                return;

            }


            n = f.fbq = function() {


                n.callMethod

                    ?

                    n.callMethod.apply(

                        n,

                        arguments

                    )

                    :

                    n.queue.push(

                        arguments

                    );

            };


            if(!f._fbq) {

                f._fbq = n;

            }


            n.push = n;


            n.loaded = true;


            n.version = '2.0';


            n.queue = [];


            t = b.createElement(e);


            t.async = true;


            t.src = v;


            s =

                b.getElementsByTagName(e)[0];


            s.parentNode.insertBefore(

                t,

                s

            );


        }(

            window,

            document,

            'script',

            'https://connect.facebook.net/en_US/fbevents.js'

        );



        /*
         * Prevent duplicate Pixel initialization.
         */

        if(window[pixelGuardKey]) {

            return;

        }



        let pixelAlreadyRegistered = false;



        try {


            if(

                typeof fbq.getState ===

                'function'

            ) {


                const pixelState =

                    fbq.getState();



                if(

                    pixelState &&

                    Array.isArray(pixelState.pixels)

                ) {


                    pixelAlreadyRegistered =

                        pixelState.pixels.some(

                            (pixel) =>


                                String(pixel.id) ===

                                String(CONFIG.pixelId)

                        );

                }

            }

        }

        catch(error) {


            pixelAlreadyRegistered = false;

        }



        if(!pixelAlreadyRegistered) {


            fbq(

                'init',

                CONFIG.pixelId

            );

        }



        window[pixelGuardKey] = true;

    }



    /* =====================================================
       SESSION PAGEVIEW
    ====================================================== */

    function sessionPageViewExists() {


        try {


            return (

                sessionStorage.getItem(

                    CONFIG.pageViewSessionKey

                ) === 'true'

            );

        }

        catch(error) {


            return false;

        }

    }



    function saveSessionPageView() {


        try {


            sessionStorage.setItem(

                CONFIG.pageViewSessionKey,

                'true'

            );

        }

        catch(error) {


            /*
             * Some browsers/private modes
             * may block sessionStorage.
             */

        }

    }



  

    function automationDetected() {


        return (

            navigator.webdriver === true

        );

    }





    function tryQualifiedPageView() {


        const timeOnPageMs =

            Date.now() - pageOpenedAt;



        /*
         * Qualification method 1:
         *
         * User interacted with the website
         * AND stayed at least 3 seconds.
         */

        const interactionQualified =


            humanInteractionDetected &&


            timeOnPageMs >=

                CONFIG.pageViewDelayMs;



        /*
         * Qualification method 2:
         *
         * Visitor stayed on the visible page
         * for at least 8 seconds.
         */

        const passiveReaderQualified =


            timeOnPageMs >=

                CONFIG.passiveReaderDelayMs;



        const canTrack =


            !pageViewTracked &&


            !sessionPageViewExists() &&


            !automationDetected() &&


            (

                interactionQualified ||

                passiveReaderQualified

            ) &&


            document.visibilityState ===

                'visible' &&


            document.hasFocus() &&


            typeof window.fbq ===

                'function';



        if(!canTrack) {


            return;

        }



        /*
         * Qualified Meta PageView
         */

        fbq(

            'track',

            'PageView',

            {


                qualified_view:

                    true,


                human_interaction:

                    humanInteractionDetected,


                qualification:

                    interactionQualified

                        ?

                        'interaction_3_seconds'

                        :

                        'focused_8_seconds',


                time_on_page:

                    Math.round(

                        timeOnPageMs / 1000

                    )

            }

        );



        pageViewTracked = true;


        saveSessionPageView();

    }



 

    function recordHumanInteraction(event) {



        if(

            !event.isTrusted ||

            humanInteractionDetected

        ) {


            return;

        }



        humanInteractionDetected = true;



        tryQualifiedPageView();

    }



    function initializeVisitorQualification() {


        const interactionEvents = [


            'pointerdown',


            'touchstart',


            'keydown',


            'scroll',


            'mousemove'


        ];



        interactionEvents.forEach(

            (eventName) => {


                window.addEventListener(

                    eventName,

                    recordHumanInteraction,

                    {

                        passive: true,

                        once: true

                    }

                );

            }

        );



        /*
         * Check after 3 seconds.
         */

        window.setTimeout(

            tryQualifiedPageView,

            CONFIG.pageViewDelayMs

        );



        /*
         * Check passive reader after 8 seconds.
         */

        window.setTimeout(

            tryQualifiedPageView,

            CONFIG.passiveReaderDelayMs

        );

    }




    function handleTelegramClick(event) {


        event.preventDefault();



        /*
         * Prevent duplicate click tracking
         * or multiple redirects.
         */

        if(navigationStarted) {


            return;

        }



        navigationStarted = true;



        const timeOnPageMs =

            Date.now() - pageOpenedAt;



        /*
         * Subscribe qualifies when:
         *
         * 1. Real browser-generated click.
         *
         * 2. navigator.webdriver is not true.
         *
         * 3. Visitor stayed on page for
         *    at least 1 second.
         */

        const isQualifiedClick =


            event.isTrusted &&


            !automationDetected() &&


            timeOnPageMs >=

                CONFIG.minimumClickTimeMs;



        /*
         * Track Subscribe only one time.
         */

        if(

            isQualifiedClick &&

            !subscribeTracked &&

            typeof window.fbq ===

                'function'

        ) {


            fbq(

                'track',

                'Subscribe',

                {


                    value:

                        0,


                    currency:

                        'INR',


                    destination:

                        'Telegram',


                    content_name:

                        'vishv book publication',


                    source:

                        'WFH  Landing Page',


                    qualified_click:

                        true,


                    time_on_page:

                        Math.round(

                            timeOnPageMs / 1000

                        )

                }

            );



            subscribeTracked = true;

        }



        /*
         * Qualified clicks wait slightly longer
         * so Meta gets a chance to send the event.
         */

        const redirectDelay =


            isQualifiedClick

                ?

                CONFIG.trackedRedirectDelayMs

                :

                CONFIG.fastRedirectDelayMs;



        window.setTimeout(

            () => {


                window.location.assign(

                    CONFIG.telegramUrl

                );

            },

            redirectDelay

        );

    }



    /* =====================================================
       CONNECT TELEGRAM CTA BUTTONS
    ====================================================== */

    function initializeTelegramButtons() {


        const buttons =

            document.querySelectorAll(

                '.join-link'

            );



        buttons.forEach(

            (button) => {


                /*
                 * Always force the correct
                 * Telegram destination.
                 */

                button.href =

                    CONFIG.telegramUrl;



                button.addEventListener(

                    'click',

                    handleTelegramClick

                );

            }

        );

    }



    /* =====================================================
       START TRACKING
    ====================================================== */

    loadMetaPixel();



    initializeVisitorQualification();



    if(

        document.readyState ===

            'loading'

    ) {


        document.addEventListener(

            'DOMContentLoaded',

            initializeTelegramButtons,

            {

                once: true

            }

        );

    }

    else {


        initializeTelegramButtons();

    }


})();

