const isObservable = (obj) => !!obj && typeof obj.subscribe === 'function';
const isPromise = (obj) => !!obj && typeof obj.then === 'function';
const CSS_SHEET_SUPPORTED = (() => {
    try {
        new CSSStyleSheet();
        return true;
    }
    catch (e) {
        return false;
    }
})();
const ofObs = (input) => ({
    subscribe: (fn) => {
        fn(input);
    }
});
const fromPromiseObs = (input) => ({
    subscribe: (fn) => {
        Promise.resolve(input).then((value) => {
            fn(value);
        });
    }
});
const createToken = () => Math.random().toString(36).substring(2);
class SubjectObs {
    _callbackCollection = {};
    unsubscribe(token) {
        delete this._callbackCollection[token];
    }
    asObservable() {
        return {
            subscribe: (fn) => this.subscribe(fn)
        };
    }
    subscribe(fn) {
        const token = createToken();
        this._callbackCollection[token] = fn;
        return () => this.unsubscribe(token);
    }
    next(value) {
        for (const token in this._callbackCollection) {
            this._callbackCollection[token](value);
        }
    }
}
class BehaviourSubjectObs extends SubjectObs {
    _initialValue;
    constructor(initialValue) {
        super();
        this._initialValue = initialValue;
    }
    subscribe(fn) {
        const unsub = super.subscribe(fn);
        super.next(this._initialValue);
        return unsub;
    }
    next(newvalue) {
        this._initialValue = newvalue;
        super.next(newvalue);
    }
}
class Subscriptions {
    _subcribers = [];
    add(fn) {
        this._subcribers.push(fn);
    }
    unsubscribe() {
        for (const fn of this._subcribers) {
            fn();
        }
        this._subcribers = [];
    }
}
const wrapIntoObservable = (value) => {
    if (isObservable(value)) {
        return value;
    }
    if (isPromise(value)) {
        return fromPromiseObs(Promise.resolve(value));
    }
    return ofObs(value);
};
const fromEvent = (target, eventName, onNext, options = false) => {
    target.addEventListener(eventName, onNext, options);
    const unsubscribe = () => {
        target.removeEventListener(eventName, onNext, options);
    };
    return unsubscribe;
};
const sanitizeHTML = (htmlString) => {
    const stringToHTML = () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return doc.body || document.createElement('body');
    };
    const removeScripts = (html) => {
        const scripts = html.querySelectorAll('script');
        for (const script of scripts) {
            script.remove();
        }
    };
    const isPossiblyDangerous = (name, value) => {
        value = value.replace(/\s+/g, '').toLowerCase();
        if (['src', 'href', 'xlink:href'].includes(name)) {
            if (value.includes('javascript:') || value.includes('data:'))
                return true;
        }
        if (name.startsWith('on'))
            return true;
    };
    const removeAttributes = (element) => {
        const attributes = element.attributes;
        for (const { name, value } of attributes) {
            if (!isPossiblyDangerous(name, value))
                continue;
            element.removeAttribute(name);
        }
    };
    const cleanAttributes = (html) => {
        const nodes = html.children;
        for (const node of nodes) {
            removeAttributes(node);
            cleanAttributes(node);
        }
    };
    const html = stringToHTML();
    removeScripts(html);
    cleanAttributes(html);
    return html.innerHTML;
};
const proxifiedClass = (setRenderIntoQueue, target) => {
    const handler = () => ({
        get(obj, prop) {
            const propertyType = Object.prototype.toString.call(obj[prop]);
            if (['[object Object]', '[object Array]'].indexOf(propertyType) > -1 && !('__metadata__' in obj[prop])) {
                return new Proxy(obj[prop], handler());
            }
            return obj[prop];
        },
        set(obj, prop, value) {
            obj[prop] = value;
            setRenderIntoQueue();
            return true;
        }
    });
    return class extends target {
        constructor(...args) {
            super(...args);
            return new Proxy(this, handler());
        }
    };
};
const promisify = () => {
    let resolver;
    const promise = new Promise((resolve) => {
        resolver = resolve;
    });
    return [promise, resolver];
};

const isFunction = (value) => typeof value === 'function';
const updateFnRegistry = Object.create(null);
let token = null;
function signalWrapper(updateFn, fn) {
    const prev = token;
    let generatedToken;
    token = createToken();
    updateFnRegistry[token] = updateFn;
    try {
        fn();
    }
    finally {
        generatedToken = token;
        token = prev;
    }
    return generatedToken;
}
function signal(initialValue) {
    const updateFn = updateFnRegistry[token];
    let value = initialValue;
    function boundSignal() {
        return value;
    }
    boundSignal.set = function (v) {
        if (isFunction(v)) {
            value = v(value);
        }
        else {
            value = v;
        }
        updateFn();
    };
    return boundSignal;
}
function augmentor(updateFn, fn) {
    const generatedToken = signalWrapper(updateFn, fn);
    return function () {
        delete updateFnRegistry[generatedToken];
    };
}

const Injector = new (class {
    map = new WeakMap();
    register(klass, instance) {
        if (!this.map.get(klass)) {
            this.map.set(klass, instance);
        }
        else {
            throw Error(`${klass} is already registered service.`);
        }
    }
    getService(klass) {
        const instance = this.map.get(klass);
        if (instance) {
            return instance;
        }
        else {
            throw Error(`${klass} is not a registered provider.`);
        }
    }
    removeService(klass) {
        this.map.delete(klass);
    }
    clear() {
        this.map = new WeakMap();
    }
})();

const instantiate = (klass, dependencies, rendererInstance) => {
    if (dependencies.length) {
        const services = [];
        for (const dependency of dependencies) {
            if (dependency.prototype.__metadata__.name !== 'RENDERER') {
                services.push(Injector.getService(dependency));
            }
            else {
                services.push(rendererInstance);
            }
        }
        return new klass(...services);
    }
    else {
        return new klass();
    }
};

const componentRegistry = new (class {
    globalStyles;
    style_registry;
    isRootNodeSet;
    globalStyleTag;
    constructor() {
        try {
            this.globalStyles = new CSSStyleSheet();
        }
        catch (e) {
            this.globalStyles = '';
        }
        this.isRootNodeSet = false;
        this.globalStyleTag = null;
    }
    getComputedCss = (styles = '', standalone) => {
        let csoArray = [];
        const defaultStyles = new CSSStyleSheet();
        defaultStyles.insertRule(`:host { display: block; }`);
        csoArray = !!standalone ? [defaultStyles] : [this.globalStyles, defaultStyles];
        if (styles) {
            const sheet = new CSSStyleSheet();
            sheet.replace(styles);
            csoArray.push(sheet);
        }
        return csoArray;
    };
})();

const { html, render } = (() => {
    const isAttributeRegex = /([^\s\\>"'=]+)\s*=\s*(['"]?)$/;
    const isNodeRegex = /<[a-z][^>]+$/i;
    const attributePrefix = 'attr';
    const attributeRegex = /^attr([^ ]+)/;
    const insertNodePrefix = 'insertNode';
    const insertNodeRegex = /^insertNode([^ ]+)/;
    let refNodes = [];
    let inputPropsNodes = [];
    const _sanitize = (data) => {
        const tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '(': '%28',
            ')': '%29'
        };
        let str = JSON.stringify(data);
        const replaceTag = (tag) => tagsToReplace[tag] || tag;
        const safe_tags_replace = (str) => str.replace(/[&<>\(\)]/g, replaceTag);
        str = safe_tags_replace(str);
        return JSON.parse(str);
    };
    const _setValuesForDropdown = (node, value) => {
        const options = node.options, values = Array.isArray(value) ? value : [value];
        let optionSet, option, i = options.length;
        while (i--) {
            option = options[i];
            const value = option.getAttribute('value') ?? (option.textContent.match(/[^\x20\t\r\n\f]+/g) || []).join(' ');
            if ((option.selected = values.indexOf(value) > -1)) {
                optionSet = true;
            }
        }
        if (!optionSet) {
            node.selectedIndex = -1;
        }
    };
    const _createFragment = (markup) => {
        const temp = document.createElement('template');
        temp.innerHTML = markup;
        return temp.content;
    };
    const _bindDataInput = (node, val, symbol) => {
        const fn = () => {
            setTimeout(() => {
                if (node.isConnected) {
                    const event = new CustomEvent('bindprops', {
                        detail: {
                            props: val
                        },
                        bubbles: false
                    });
                    node.dispatchEvent(event);
                }
            });
        };
        node[symbol] = JSON.stringify(val);
        inputPropsNodes.push(fn);
    };
    const _bindFragments = (fragment, values) => {
        const elementsWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT, null);
        let node = elementsWalker.nextNode();
        while (node) {
            if (node.hasAttributes()) {
                const customAttributes = Array.from(node.attributes).filter((attr) => attributeRegex.test(attr.nodeName));
                for (const { nodeName, nodeValue } of customAttributes) {
                    const i = attributeRegex.exec(nodeName)[1];
                    switch (true) {
                        case /^on+/.test(nodeValue): {
                            const eventName = nodeValue.slice(2).toLowerCase();
                            node.removeEventListener(eventName, values[i]);
                            node.addEventListener(eventName, values[i]);
                            break;
                        }
                        case /ref/.test(nodeValue): {
                            const closure = function () {
                                this.node.isConnected && this.fn(this.node);
                            }.bind({ node, fn: values[i] });
                            refNodes.push(closure);
                            break;
                        }
                        case /^data-+/.test(nodeValue):
                        case /^aria-+/.test(nodeValue): {
                            if (nodeValue === 'data-input') {
                                _bindDataInput(node, values[i], Symbol('input'));
                            }
                            else {
                                node.setAttribute(nodeValue, _sanitize(values[i]));
                            }
                            break;
                        }
                        case /class/.test(nodeValue): {
                            if (values[i]) {
                                node.classList.add(...values[i].split(' '));
                            }
                            else {
                                node.setAttribute('class', '');
                            }
                            break;
                        }
                        case /value/.test(nodeValue): {
                            if (node.nodeName.toLowerCase() === 'select') {
                                _setValuesForDropdown(node, values[i]);
                            }
                            else {
                                node.value = _sanitize(values[i]);
                            }
                            break;
                        }
                        case /disabled/.test(nodeValue):
                        case /checked/.test(nodeValue): {
                            if (values[i]) {
                                node.setAttribute(nodeValue, values[i]);
                            }
                            else {
                                node.removeAttribute(nodeValue);
                            }
                            break;
                        }
                        default: {
                            node.setAttribute(nodeValue, _sanitize(values[i]));
                        }
                    }
                    node.removeAttribute(nodeName);
                }
            }
            node = elementsWalker.nextNode();
        }
    };
    const _replaceInsertNodeComments = (fragment, values) => {
        const commentsWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT, null);
        let node = commentsWalker.nextNode(), match;
        while (node) {
            if ((match = insertNodeRegex.exec(node.data))) {
                const nodesList = Array.isArray(values[match[1]]) ? values[match[1]] : [values[match[1]]];
                node.replaceWith(...nodesList);
                commentsWalker.currentNode = fragment;
            }
            node = commentsWalker.nextNode();
        }
    };
    const _diffAttributes = (templateNode, domNode) => {
        if (!templateNode || !domNode || templateNode.nodeType !== 1 || domNode.nodeType !== 1)
            return;
        const templateAtts = templateNode.attributes;
        const existingAtts = domNode.attributes;
        const preserveAttributesAttr = domNode.getAttribute('data-preserve-attributes');
        const preserveExistingAttributes = preserveAttributesAttr && preserveAttributesAttr === 'true';
        for (const { name, value } of templateAtts) {
            if (!existingAtts[name] || existingAtts[name] !== value) {
                domNode.setAttribute(name, value);
            }
        }
        if (!preserveExistingAttributes) {
            for (const { name } of existingAtts) {
                if (!templateAtts[name]) {
                    domNode.removeAttribute(name);
                }
            }
        }
        if (domNode.tagName.toLowerCase() === 'input') {
            domNode.value = templateNode.value;
        }
        if (domNode.tagName.indexOf('-') > -1 && templateNode.tagName.indexOf('-') > -1) {
            const templateInputSymbol = Object.getOwnPropertySymbols(templateNode).find((symbol) => symbol.description === 'input');
            const domInputSymbol = Object.getOwnPropertySymbols(domNode).find((symbol) => symbol.description === 'input');
            const templateInput = templateInputSymbol ? templateNode[templateInputSymbol] : '';
            const domInput = domInputSymbol ? domNode[domInputSymbol] : '';
            if (templateInput && domInput && templateInput !== domInput) {
                _bindDataInput(domNode, JSON.parse(templateInput), domInputSymbol);
            }
        }
    };
    const _getNodeType = (node) => {
        if (node.nodeType === 3)
            return 'text';
        if (node.nodeType === 8)
            return 'comment';
        return node.tagName.toLowerCase();
    };
    const _getNodeContent = (node) => {
        if (node.childNodes && node.childNodes.length > 0)
            return null;
        return node.textContent;
    };
    const _diff = (template, element, isChildDiffing) => {
        const domNodes = element ? Array.from(element.childNodes) : [];
        const templateNodes = template ? Array.from(template.childNodes) : [];
        let count = domNodes.length - templateNodes.length;
        if (count > 0) {
            for (; count > 0; count--) {
                domNodes[domNodes.length - count].parentNode.removeChild(domNodes[domNodes.length - count]);
            }
        }
        templateNodes.forEach((node, index) => {
            const domNode = domNodes[index];
            _diffAttributes(node, domNode);
            if (isChildDiffing && domNode && domNode.nodeType === 1 && domNode.tagName.indexOf('-') > -1) {
                return;
            }
            if (!domNode) {
                element && element.appendChild(node);
                return;
            }
            if (_getNodeType(node) !== _getNodeType(domNode)) {
                domNode.replaceWith(node);
                return;
            }
            const templateContent = _getNodeContent(node);
            if (templateContent && templateContent !== _getNodeContent(domNode)) {
                domNode.textContent = templateContent;
                return;
            }
            if (domNode.childNodes.length > 0 && node.childNodes.length < 1) {
                domNode.innerHTML = '';
                return;
            }
            if (domNode.childNodes.length < 1 && node.childNodes.length > 0) {
                const fragment = document.createDocumentFragment();
                _diff(node, fragment, false);
                domNode.appendChild(fragment);
                return;
            }
            if (node.childNodes.length > 0) {
                _diff(node, domNode, true);
                return;
            }
        });
    };
    const html = (templates, ...values) => {
        let result = '';
        const { length } = templates;
        for (let i = 1; i < length; i++) {
            const variable = values[i - 1];
            let isAttributePart = false;
            result += templates[i - 1];
            if (isAttributeRegex.test(result) && isNodeRegex.test(result)) {
                result = result.replace(isAttributeRegex, (_, $1, $2) => `${attributePrefix}${i - 1}=${$2 || '"'}${$1}${$2 ? '' : '"'}`);
                isAttributePart = true;
            }
            if (!isAttributePart) {
                switch (true) {
                    case Array.isArray(variable):
                    case variable instanceof DocumentFragment: {
                        result += `<!--${insertNodePrefix}${i - 1}-->`;
                        break;
                    }
                    case typeof variable === 'object' && variable !== null: {
                        if ('html' in variable) {
                            result += variable['html'];
                        }
                        break;
                    }
                    default: {
                        result += variable || '';
                    }
                }
            }
        }
        result += templates[length - 1];
        const fragment = _createFragment(result.trim());
        _bindFragments(fragment, values);
        _replaceInsertNodeComments(fragment, values);
        return fragment;
    };
    const render = (where, what) => {
        if (where && !where.children.length) {
            where.innerHTML = '';
            where.appendChild(what);
        }
        else {
            _diff(what, where, false);
        }
        refNodes.forEach((fn) => {
            fn();
        });
        refNodes = [];
        inputPropsNodes.forEach((fn) => {
            fn();
        });
        inputPropsNodes = [];
    };
    return { html, render };
})();

class Renderer {
    _hostElement;
    _shadowRoot;
    get __metadata__() {
        return { name: 'RENDERER' };
    }
    get hostElement() {
        return this._hostElement;
    }
    get shadowRoot() {
        return this._shadowRoot;
    }
    update;
    emitEvent;
    constructor(_hostElement, _shadowRoot) {
        this._hostElement = _hostElement;
        this._shadowRoot = _shadowRoot;
    }
}

const DEFAULT_COMPONENT_OPTIONS = {
    selector: '',
    root: false,
    styles: '',
    deps: [],
    standalone: false,
    shadowDomEncapsulation: true
};
const createStyleTag = (content, where = null) => {
    const tag = document.createElement('style');
    tag.innerHTML = content;
    where && where.appendChild(tag);
    return tag;
};
const registerElement = async (options, target) => {
    options = { ...DEFAULT_COMPONENT_OPTIONS, ...options };
    if (isPromise(options.styles)) {
        const dynamicStyles = await options.styles;
        options.styles = dynamicStyles.default.toString();
    }
    options.styles = options.styles.toString();
    if (options.root && !componentRegistry.isRootNodeSet) {
        componentRegistry.isRootNodeSet = true;
        if (options.styles) {
            componentRegistry.globalStyleTag = createStyleTag(options.styles, document.head);
            componentRegistry.globalStyles.replace(options.styles);
        }
    }
    else if (options.root && componentRegistry.isRootNodeSet) {
        throw Error('Cannot register duplicate root component in ' + options.selector + ' component');
    }
    window.customElements.define(options.selector, class extends HTMLElement {
        klass;
        shadow;
        componentStyleTag = null;
        internalSubscriptions = new Subscriptions();
        renderCount = 0;
        static get observedAttributes() {
            return target.observedAttributes || [];
        }
        constructor() {
            super();
            if (options.shadowDomEncapsulation && CSS_SHEET_SUPPORTED) {
                this.shadow = this.attachShadow({ mode: 'open' });
                this.shadow.adoptedStyleSheets = componentRegistry.getComputedCss(options.styles, options.standalone);
            }
            else {
                this.shadow = this;
                const id = createToken();
                this.setAttribute('data-did', id);
                const styles = options.styles.replaceAll(':host', `${options.selector}[data-did='${id}']`);
                this.componentStyleTag = createStyleTag(styles, document.head);
            }
            this.getInstance = this.getInstance.bind(this);
            this.update = this.update.bind(this);
            this.setRenderIntoQueue = this.setRenderIntoQueue.bind(this);
            this.createProxyInstance();
        }
        createProxyInstance() {
            const rendererInstance = new Renderer(this, this.shadow);
            rendererInstance.update = () => {
                this.update();
            };
            rendererInstance.emitEvent = (eventName, data) => {
                this.emitEvent(eventName, data);
            };
            this.klass = instantiate(proxifiedClass(this.setRenderIntoQueue, target), options.deps, rendererInstance);
        }
        update() {
            const renderValue = this.klass.render();
            if (typeof renderValue === 'string') {
                this.shadow.innerHTML = sanitizeHTML(renderValue);
            }
            else {
                render(this.shadow, renderValue);
            }
        }
        emitEvent(eventName, data) {
            const event = new CustomEvent(eventName, {
                detail: data
            });
            this.dispatchEvent(event);
        }
        setProps(propsObj) {
            for (const [key, value] of Object.entries(propsObj)) {
                if (target.observedProperties.find((property) => property === key)) {
                    this.klass[key] = value;
                }
            }
            this.klass.onPropertiesChanged?.();
        }
        getInstance() {
            return this.klass;
        }
        setRenderIntoQueue() {
            ++this.renderCount;
            if (this.renderCount === 1) {
                queueMicrotask(() => {
                    this.update();
                    this.renderCount = 0;
                });
            }
        }
        connectedCallback() {
            this.internalSubscriptions.add(fromEvent(this, 'bindprops', (e) => {
                const propsObj = e.detail.props;
                propsObj && this.setProps(propsObj);
            }));
            this.internalSubscriptions.add(fromEvent(this, 'refresh_component', () => {
                this.update();
            }));
            this.internalSubscriptions.add(fromEvent(window, 'onLanguageChange', () => {
                this.update();
            }));
            if (this.klass.beforeMount) {
                this.internalSubscriptions.add(augmentor(this.setRenderIntoQueue, this.klass.beforeMount.bind(this.klass)));
            }
            this.update();
            this.klass.mount?.();
        }
        attributeChangedCallback(name, oldValue, newValue) {
            this.klass.onAttributesChanged?.(name, oldValue, newValue);
        }
        disconnectedCallback() {
            this.renderCount = 0;
            this.klass.unmount?.();
            this.componentStyleTag?.remove();
            this.internalSubscriptions.unsubscribe();
        }
    });
};

const SERVICE_OPTIONS_DEFAULTS = {
    deps: []
};
const Component = (options) => (target) => {
    if (options.selector.indexOf('-') <= 0) {
        throw new Error('You need at least 1 dash in the custom element name!');
    }
    if (!window.customElements.get(options.selector)) {
        Object.defineProperty(target.prototype, 'selector', {
            get() {
                return options.selector;
            }
        });
        registerElement(options, target);
    }
};
const Injectable = (options = {}) => (target) => {
    options = { ...SERVICE_OPTIONS_DEFAULTS, ...options };
    target.prototype.__metadata__ = {
        name: 'SERVICE'
    };
    if (options.deps.some((dep) => dep.prototype.__metadata__?.name === 'RENDERER')) {
        throw Error('Renderer cannot be a dependency for a service. It should be used with component');
    }
    const instance = instantiate(target, options.deps);
    Injector.register(target, instance);
};
const InjectionToken = (name, target) => {
    const token = typeof name === 'string' ? { name } : name;
    Injector.register(token, target);
    return token;
};

class DomTransition {
    transition = '';
    constructor() {
        this.whichTransitionEnd();
    }
    onTransitionEnd(element, cb, duration) {
        let called = false;
        let unSubscribeEvent = null;
        const _fn = () => {
            if (!called) {
                called = true;
                cb && cb();
                unSubscribeEvent();
                unSubscribeEvent = null;
            }
        };
        unSubscribeEvent = fromEvent(element, this.transition, () => {
            _fn();
        });
        setTimeout(_fn, duration);
    }
    animationsComplete(element) {
        if (element.getAnimations) {
            return Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
        }
        else {
            return Promise.allSettled([true]);
        }
    }
    whichTransitionEnd() {
        const element = document.createElement('div');
        const styleobj = element.style;
        const transitions = {
            transition: 'transitionend',
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'otransitionend'
        };
        for (const t in transitions) {
            if (typeof styleobj[t] !== 'undefined') {
                this.transition = transitions[t];
                break;
            }
        }
    }
}
Injectable()(DomTransition);

export { BehaviourSubjectObs, Component, DomTransition, Injectable, InjectionToken, Injector, Renderer, SubjectObs, Subscriptions, fromEvent, html, promisify, render, signal, wrapIntoObservable };
