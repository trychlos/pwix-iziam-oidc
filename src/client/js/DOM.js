/*
 * pwix:core-ui/src/client/js/DOM.js
 */

import _ from 'lodash';

CoreUI.DOM = {

    // Set the same height for all panes of a tabbed panel
    sameHeight( $tabbed ){
        maxheight = 0;
        tabs = $tabbed.find( '> .tab-content > .tab-pane' );
        $.each( tabs, function(){
            console.debug( this );
            this.classList.add( 'active' ); /* make each visible */
            maxheight = ( this.clientHeight > maxheight ? this.clientHeight : maxheight );
            if( !$( this ).hasClass( 'show' )){
                this.classList.remove( 'active' ); /* hide again */
            }
        });
        $.each( tabs, function(){
            $( this ).height( maxheight );
        });
    },

    // Set the same width on the given selectors
    sameWidth( selectors ){
        let promises = [];
        selectors.every(( sel ) => {
            promises.push( CoreUI.DOM.waitFor( sel ));
            return true;
        });
        Promise.allSettled( promises )
            .then(() => {
                let widths = [];
                selectors.every(( sel ) => {
                    widths.push( document.querySelector( sel ).offsetWidth );
                    return true;
                });
                const max = parseInt( 1+_.max( widths ));
                selectors.every(( sel ) => {
                    document.querySelector( sel ).style.width = max+'px';
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
