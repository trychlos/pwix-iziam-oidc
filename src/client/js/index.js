/*
 * pwix:core-ui/src/client/js/index.js
 */

import '../../common/js/index.js';

// 2023.06: @popperjs/core 2.11.8
// 2023.06: bootstrap 5.3.0
import '@popperjs/core/dist/cjs/popper.js';
import 'bootstrap/dist/js/bootstrap.min.js';

// FontAwesome are made globally available in the application
// NB: our free version include 'solid' and 'brand' icon styles
// see also https://fontawesome.com/how-to-use/on-the-web/setup/getting-started
// 2023.06: fontawesome-free-6.4.0-web
import '../third-party/fontawesome-free-6.4.0-web/js/all.js';
