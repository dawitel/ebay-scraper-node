"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailTemplate = exports.EmailTemplate = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const server_1 = __importDefault(require("react-dom/server"));
const EmailTemplate = ({ firstName, }) => ((0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsxs)("h1", { children: ["Hi ", firstName, "\u270B! This is the Scraped data from your last upload. Enjoy your data\uD83C\uDF89!"] }) }));
exports.EmailTemplate = EmailTemplate;
const renderEmailTemplate = (props) => {
    return server_1.default.renderToStaticMarkup((0, jsx_runtime_1.jsx)(exports.EmailTemplate, Object.assign({}, props)));
};
exports.renderEmailTemplate = renderEmailTemplate;
