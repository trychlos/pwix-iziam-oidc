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
    api.use( 'pwix:iziam-oidc' );
    api.mainModule( 'test/js/index.js' );
});

function configure( api ){
    api.versionsFrom( '2.9.0' );
    api.export([
        'izIAM'
    ]);
    api.use( 'ecmascript', ['client', 'server'] );
    api.use( 'oauth', ['client', 'server'] );
    api.use( 'oauth2', ['client', 'server'] );
    api.use( 'pwix:core-app' );
    api.use( 'pwix:i18n@1.5.2' );
    api.use( 'random', 'client' );
    api.use( 'service-configuration', ['client', 'server'] );
    api.use( 'tmeasday:check-npm-versions@1.0.2', 'server' );
    api.use( 'tracker' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies
