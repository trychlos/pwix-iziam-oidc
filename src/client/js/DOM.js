/*
 * pwix:core-ui/src/client/js/DOM.js
 */

import _ from 'lodash';

CoreUI.DOM = {

    // Set the same width on the given selectors
    sameWidth( selectors ){
        let promises = [];
        selectors.every(( sel ) => {
            promises.push( CoreUI.DOM.waitFor( sel+' td:first-child' ));
            return true;
        });
        Promise.allSettled( promises )
            .then(() => {
                let widths = [];
                selectors.every(( sel ) => {
                    widths.push( document.querySelector( sel+' td:first-child' ).offsetWidth );
                    return true;
                });
                const max = parseInt( 1+_.max( widths ));
                selectors.every(( sel ) => {
                    document.querySelector( sel+' td:first-child' ).style.width = max+'px';
                    return true;
                });
            });
    },

    // https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
    //  only initialize jQuery plugins when the DOM element is available
    //  returns a Promise which will resolve when the selector will be DOM-ready
    waitFor( selector ){
        //console.debug( 'waitFor', selector );
        return new Promise(( resolve ) => {
            if( document.querySelector( selector )){
                return resolve( document.querySelector( selector ));
            }
            const observer = new MutationObserver(( mutations ) => {
                if( document.querySelector( selector )){
                    resolve( document.querySelector( selector ));
                    observer.disconnect();
                }
            });
            observer.observe( document.body, {
                childList: true,
                subtree: true
            });
        });
    }
};
