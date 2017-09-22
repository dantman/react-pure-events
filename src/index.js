'use strict';
import React, {Component} from 'react';
import hoistNonReactMethods from 'hoist-non-react-methods';
import omit from 'lodash/omit';
import flatten from 'lodash/flatten';

// @todo add tests
//  - Test that the various decorator formats work
//  - test against the react version used by react-native

function makeDecorator(events, guard) {
	events = flatten(events);

	return (BaseComponent) => {
		// @todo Hoist methods
		class Wrapper extends Component {
			// @todo Is it worth it to wrap propTypes now that they are deprecated?

			_setMainRef = (ref) => {
				this._mainRef = ref;
			};

			_eventHandlers = {};

			_eventHandlerFor(name) {
				if ( !this._eventHandlers[name] ) {
					this._eventHandlers[name] = (...args) => {
						if ( typeof this.props[name] === 'function' ) {
							return this.props[name].apply(null, args);
						}
					};
				}

				return this._eventHandlers[name];
			}

			render() {
				const otherProps = omit(this.props, events);

				const eventProps = {};
				for ( const event of events ) {
					const value = this.props[event];

					if ( guard || typeof value === 'function' ) {
						eventProps[event] = this._eventHandlerFor(event);
					} else if ( event in this.props ) {
						eventProps[event] = value;
					}
				}

				return (
					<BaseComponent
						ref={this._setMainRef}
						{...otherProps}
						{...eventProps} />
				);
			}
		}

		Wrapper.displayName = `wrapPureEventProps(${BaseComponent.displayName || BaseComponent.name || 'Component'})`;

		return hoistNonReactMethods(Wrapper, BaseComponent, (component) => component._mainRef);
	};
}

/**
 * Wraps a PureComponent with a HOC that replaces a set of event props
 * with functions that call the event prop, but if passed are the same on every
 * render() call even if the actual function passed to the HOC changes.
 *
 * This guarantees that even if a caller uses `onEvent={() => {}}` which causes
 * a new function instance to be passed every render the PureComponent will always
 * receive the same prop and remain purely optimized.
 */
export function wrapPureEventProps(...events) {
	return makeDecorator(events, false);
}

/**
 * Does the same as @wrapPureEventProps, but also guarantees that if an event prop
 * is not a function (not passed or invalid) a noop function will be passed instead.
 */
export function guardPureEventProps(...events) {
	return makeDecorator(events, true);
}
