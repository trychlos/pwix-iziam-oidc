// openid-client uses jose which describes its exports as virtuals, i.e. exports are mapped from files to other paths
// Unfortunately, MeteorJS doesn't know how to handle these mapped exports when used from MeteorJS packages!
// So have to shim the needed exports to physical files (list of openid-client v6.8.4)
// https://claude.ai/chat/58ad8a61-cefb-46b9-aae3-30458f0f066b

const fs = Npm.require( 'fs' );
const path = Npm.require( 'path' );

(function patchJoseExports(){
    try {
        // process.cwd() is the app root when Meteor invokes package.js
        const joseRoot = path.join( process.cwd(), 'node_modules', 'jose' );
        if( !fs.existsSync( joseRoot )) return; // app hasn't installed jose yet — nothing to patch

        const decryptDir = path.join( joseRoot, 'jwe', 'compact' );
        const decryptFile = path.join( decryptDir, 'decrypt.js' );
        if( !fs.existsSync( decryptFile )){
            fs.mkdirSync( decryptDir, { recursive: true });
            fs.writeFileSync( decryptFile, `export * from '../../dist/webapi/jwe/compact/decrypt.js';\n` );
        }

        const errorsFile = path.join( joseRoot, 'errors.js' );
        if( !fs.existsSync( errorsFile )){
            fs.writeFileSync( errorsFile, `export * from './dist/webapi/util/errors.js';\n` );
        }
    } catch (e) {
        console.warn( '[pwix:iziam-oidc] could not patch jose exports shim:', e.message );
    }
})();

Package.describe({
    name: 'pwix:iziam-oidc',
    version: '1.1.0',
    summary: 'izIAM OpenID Connect login flow',
    git: 'https://github.com/trychlos/pwix-iziam-oidc.git',
    documentation: 'README.md'
});

Package.onUse( function( api ){
    configure( api );
    api.mainModule( 'src/client/js/index.js', 'client' );
    api.mainModule( 'src/server/js/index.js', 'server' );
});

Package.onTest( function( api ){
    configure( api );
    api.use( 'tinytest' );
    api.use( 'pwix:iziam-oidc' );
    api.mainModule( 'test/js/index.js' );
});

function configure( api ){
    api.versionsFrom([ '2.9.0', '3.0-rc.1' ]);
    api.export([
        'iziamOIDC'
    ]);
    api.use( 'ecmascript' );
    api.use( 'fetch' );
    api.use( 'oauth' );
    api.use( 'oauth2' );
    api.use( 'pwix:env-settings@2.1.0' );
    api.use( 'pwix:env-settings-ext@1.3.0' );
    api.use( 'pwix:logger@1.0.0' );
    api.use( 'random', 'client' );
    api.use( 'service-configuration' );
    api.use( 'tmeasday:check-npm-versions@2.0.0', 'server' );
    api.use( 'tracker' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies
