/*
 * pwix:core-ui/src/client/js/DOM.js
 */

CoreUI.DOM = {

    // https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
    //  only initialize jQuery plugins when the DOM element is available
    waitFor( selector ){
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
