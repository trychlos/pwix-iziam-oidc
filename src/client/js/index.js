/*
 * pwix:core-ui/src/client/js/index.js
 */

import '../../common/js/index.js';

// 2023.06: @popperjs/core 2.11.8
// 2023.06: bootstrap 5.3.0
import '@popperjs/core/dist/cjs/popper.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

// FontAwesome are made globally available in the application
// NB: our free version include 'solid' and 'brand' icon styles
// see also https://fontawesome.com/how-to-use/on-the-web/setup/getting-started
// 2023.06: fontawesome-free-6.4.0-web
import '../third-party/fontawesome-free-6.4.0-web/js/all.js';

// provides base classes in CoreUI global object
import { FormChecker } from '../classes/form-checker.class.js';
import { FormMultiple } from '../classes/form-multiple.class.js';
import { Page } from '../classes/page.class.js';
import { PageCurrent } from '../classes/page-current.class.js';
import { PagesCollection } from '../classes/pages-collection.class.js';

CoreUI.FormChecker = FormChecker;
CoreUI.FormMultiple = FormMultiple;
CoreUI.Page = Page;
CoreUI.PageCurrent = PageCurrent;
CoreUI.PagesCollection = PagesCollection;

// our functions
import './DOM.js';
