/*
 * pwix:core-ui/src/common/js/index.js
 */

import { MessagesSet } from '../classes/messages-set.class.js';
import { TypedMessage } from '../classes/typed-message.class.js';

import { FieldCheck } from '../definitions/field-check.def.js';
import { FieldType } from '../definitions/field-type.def.js';
import { YesNo } from '../definitions/yesno.def.js';

import './global.js';
import './constants.js';
//
import './configure.js';
import './env-settings.js';
import './i18n.js';

CoreUI.MessagesSet = MessagesSet;
CoreUI.TypedMessage = TypedMessage;

CoreUI.FieldCheck = FieldCheck;
CoreUI.FieldType = FieldType;
CoreUI.YesNo = YesNo;
