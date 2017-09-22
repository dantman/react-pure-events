React Pure Events
=================
[![npm][npm-badge]][npm]
[![MIT][license-badge]][license]
[![dependencies][dependencies-badge]][dependencies]
[![devDependencies][devDependencies-badge]][devDependencies]
[![Build Status][travis-ci-badge]][travis-ci]
[![Codecov][codecov-badge]][codecov]

[npm-badge]: https://img.shields.io/npm/v/react-pure-events.svg
[npm]: https://www.npmjs.com/package/react-pure-events
[license-badge]: https://img.shields.io/npm/l/react-pure-events.svg
[license]: https://github.com/dantman/react-pure-events/blob/master/LICENSE
[dependencies-badge]: https://img.shields.io/david/dantman/react-pure-events.svg
[dependencies]: https://david-dm.org/dantman/react-pure-events
[devDependencies-badge]: https://img.shields.io/david/dev/dantman/react-pure-events.svg
[devDependencies]: https://david-dm.org/dantman/react-pure-events?type=dev
[travis-ci-badge]: https://img.shields.io/travis/dantman/react-pure-events.svg
[travis-ci]: https://travis-ci.org/dantman/react-pure-events
[codecov-badge]: https://img.shields.io/codecov/c/github/dantman/react-pure-events.svg
[codecov]: https://codecov.io/gh/dantman/react-pure-events

A HOC wrapper that makes events props passed to React PureComponents pure.

React Pure Events can be used to make event properties "pure" no matter what is passed to your component.

Normally if someone passes `onEvent={() => {}}` in a render method to your PureComponent it will completely break the PureComponent optimization. Every single render a new function instance will be created so `nextProps.onEvent === prevProps.onEvent` will never be true.

React Pure Events wraps your PureComponent in a Higher Order Component (HOC) that replaces the function values for any props you define as an event prop with a function that will still call the function passed as a prop, but will not change between renders. Guaranteeing that your PureComponent optimizations work no matter how the caller defines the event.

The guard version also guarantees that the prop will never be a non-function, so you can safely call `this.props.onEvent()` without testing the type or providing your own noop.

## Installation

```shell
npm install --save react-pure-events
```

## Using

### wrapPureEventProps(...events)
`wrapPureEventProps` wraps a PureComponent with a HOC that replaces a set of event props with functions that call the event prop, but if passed are the same on every render() call even if the actual function passed to the HOC changes.

This guarantees that even if a caller uses `onEvent={() => {}}` which causes a new function instance to be passed every render the PureComponent will always receive the same prop and remain purely optimized.

```js
import React, {PureComponent} from 'react';
import {wrapPureEventProps} from 'react-pure-events';

// As a decorator
@wrapPureEventProps('onEvent', 'onEvent2')
export default class MyComponent extends PureComponent {
    onSomethingFinished() {
        if ( this.props.onEvent ) {
            this.props.onEvent();
        }
    }
    // ...
}

// As a function
class MyComponent extends PureComponent {
    // ...
}

export default wrapPureEventProps('onEvent', 'onEvent2')(MyComponent);
```

## guardPureEventProps(...events)
`guardPureEventProps` does the same as `wrapPureEventProps`, but also guarantees that if an event prop is not a function (not passed or invalid) a noop function will be passed instead.

```js
import React, {PureComponent} from 'react';
import {guardPureEventProps} from 'react-pure-events';

// As a decorator
@guardPureEventProps('onEvent', 'onEvent2')
export default class MyComponent extends PureComponent {
    onSomethingFinished() {
        this.props.onEvent();
    }
    // ...
}

// As a function
class MyComponent extends PureComponent {
    // ...
}

export default guardPureEventProps('onEvent', 'onEvent2')(MyComponent);
```