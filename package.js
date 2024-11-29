Package.describe({
    name: 'pwix:iziam-oidc',
    version: '1.0.0-rc',
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
        'izIAM'
    ]);
    api.use( 'ecmascript' );
    api.use( 'fetch' );
    api.use( 'oauth' );
    api.use( 'oauth2' );
    api.use( 'pwix:env-settings@2.1.0-rc' );
    api.use( 'random', 'client' );
    api.use( 'service-configuration' );
    api.use( 'tmeasday:check-npm-versions@2.0.0', 'server' );
    api.use( 'tracker' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies
