/*
 * pwix:core-ui/src/common/js/index.js
 */

import { MessagesSet } from '../classes/messages-set.class.js';
import { TypedMessage } from '../classes/typed-message.class.js';

import './global.js';
import './constants.js';
//
import './configure.js';
import './env-settings.js';
import './i18n.js';

CoreUI.MessagesSet = MessagesSet;
CoreUI.TypedMessage = TypedMessage;
